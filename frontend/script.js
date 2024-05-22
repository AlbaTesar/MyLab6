document.addEventListener('DOMContentLoaded', () => {
  const BASE_URL = 'https://mylab6.onrender.com';  // Укажите ваш URL

  // Функция для установки состояния аутентификации
  function setAuthState(isAuthenticated) {
    document.getElementById('logoutButton').style.display = isAuthenticated ? 'block' : 'none';
    document.getElementById('deleteAccountButton').style.display = isAuthenticated ? 'block' : 'none';
    document.getElementById('taskForm').style.display = isAuthenticated ? 'block' : 'none';
  }

  document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        alert('Вы успешно вошли');
        setAuthState(true);
        window.location.reload(); // Перезагружаем страницу после входа
      } else {
        throw new Error(data.message || 'Не получен токен');
      }
    } catch (error) {
      console.error('Ошибка при входе:', error);
      alert('Ошибка при входе: ' + error.message);
    }
  });

  document.getElementById('registerForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const newUsername = document.getElementById('newUsername').value;
    const newPassword = document.getElementById('newPassword').value;
    const newEmail = document.getElementById('newEmail').value;
    try {
      const response = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: newUsername, password: newPassword, email: newEmail })
      });
      const data = await response.text();
      if (response.ok) {
        alert(data);
        window.location.reload(); // Перезагружаем страницу после регистрации
      } else {
        throw new Error(data || 'Ошибка при регистрации');
      }
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
      alert('Ошибка при регистрации: ' + error.message);
    }
  });

  document.getElementById('forgotPasswordButton').addEventListener('click', () => {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'block';
  });

  document.getElementById('forgotPasswordForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('forgotEmail').value;
    try {
      const response = await fetch(`${BASE_URL}/forgotPassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      const data = await response.text();
      if (response.ok) {
        alert(data);
      } else {
        throw new Error(data || 'Ошибка при сбросе пароля');
      }
    } catch (error) {
      console.error('Ошибка при сбросе пароля:', error);
      alert('Ошибка при сбросе пароля: ' + error.message);
    }
  });

  const token = localStorage.getItem('token');
  if (token) {
    fetch(`${BASE_URL}/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error('Не удалось получить данные пользователя');
      }
    })
    .then(data => {
      console.log('Данные пользователя:', data);
      document.getElementById('loginForm').style.display = 'none';
      document.getElementById('registerForm').style.display = 'none';
      setAuthState(true);
      const userDisplay = document.createElement('p');
      userDisplay.textContent = `Привет, ${data.username}!`;
      document.body.insertBefore(userDisplay, document.getElementById('taskForm'));
      loadFoldersAndTasks(); // Загружаем папки и задачи, теперь, когда пользователь аутентифицирован
    })
    .catch(error => {
      console.error('Ошибка:', error);
      localStorage.removeItem('token'); // При ошибке удаляем неверный токен
      setAuthState(false);
    });
  } else {
    setAuthState(false);
  }

  document.getElementById('logoutButton').addEventListener('click', () => {
    localStorage.removeItem('token');
    setAuthState(false);
    window.location.reload(); // Перезагружаем страницу для обновления интерфейса
  });

  document.getElementById('deleteAccountButton').addEventListener('click', async () => {
    const confirmDelete = confirm('Вы уверены, что хотите удалить аккаунт? Это действие необратимо.');
    if (confirmDelete) {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`${BASE_URL}/deleteAccount`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          alert('Аккаунт успешно удален');
          localStorage.removeItem('token');
          setAuthState(false);
          window.location.reload();
        } else {
          throw new Error('Не удалось удалить аккаунт');
        }
      } catch (error) {
        console.error('Ошибка при удалении аккаунта:', error);
        alert('Ошибка при удалении аккаунта: ' + error.message);
      }
    }
  });

  async function loadFoldersAndTasks() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/getFoldersAndTasks`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Ошибка при загрузке папок и задач');
    }
    const folderList = document.getElementById('folderList');
    folderList.innerHTML = '';
    data.folders.forEach(folder => {
      const li = document.createElement('li');
      li.classList.add('folder');
      const folderContent = document.createElement('div');
      folderContent.textContent = folder.name;

      const buttonGroup = document.createElement('div');
      buttonGroup.classList.add('button-group');

      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Остановить всплытие события, чтобы избежать загрузки задач
        deleteFolder(folder.id);
      });
      buttonGroup.appendChild(deleteButton);

      const editButton = document.createElement('button');
      editButton.textContent = 'Change';
      editButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Остановить всплытие события, чтобы избежать загрузки задач
        changeFolder(folder.id, prompt('New folder name:', folder.name));
      });
      buttonGroup.appendChild(editButton);

      li.appendChild(folderContent);
      li.appendChild(buttonGroup);
      folderList.appendChild(li);

      const taskList = document.createElement('ul');
      taskList.id = `taskList-${folder.id}`;
      folderList.appendChild(taskList);
    });

    data.tasks.forEach(task => {
      const taskList = document.getElementById(`taskList-${task.folder}`);
      if (taskList) {
        const li = document.createElement('li');
        li.classList.add('task');
        const taskContent = document.createElement('div');
        taskContent.textContent = task.name;

        const buttonGroup = document.createElement('div');
        buttonGroup.classList.add('button-group');

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => deleteTask(task.id));
        buttonGroup.appendChild(deleteButton);

        const editButton = document.createElement('button');
        editButton.textContent = 'Change';
        editButton.addEventListener('click', () => changeTask(task.id, prompt('New task name:', task.name)));
        buttonGroup.appendChild(editButton);

        li.appendChild(taskContent);
        li.appendChild(buttonGroup);
        taskList.appendChild(li);
      }
    });
  }

  async function addFolderAndTask(folderName, taskName) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/addFolderAndTask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ folderName, taskName })
    });
    const message = await response.text();
    if (!response.ok) {
      throw new Error(message || 'Ошибка при добавлении папки и задачи');
    }
    console.log(message);
    loadFoldersAndTasks();
  }

  async function deleteFolder(folderId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/deleteFolder/${folderId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const message = await response.text();
    if (!response.ok) {
      throw new Error(message || 'Ошибка при удалении папки');
    }
    console.log(message);
    loadFoldersAndTasks();
  }

  async function changeFolder(folderId, newFolderName) {
    if (!newFolderName) return; // Если пользователь отменил изменение
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/updateFolder/${folderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name: newFolderName })
    });
    const message = await response.text();
    if (!response.ok) {
      throw new Error(message || 'Ошибка при изменении папки');
    }
    console.log(message);
    loadFoldersAndTasks();
  }

  async function deleteTask(taskId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/deleteTask/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const message = await response.text();
    if (!response.ok) {
      throw new Error(message || 'Ошибка при удалении задачи');
    }
    console.log(message);
    loadFoldersAndTasks();
  }

  async function changeTask(taskId, newTaskName) {
    if (!newTaskName) return; // Если пользователь отменил изменение
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/updateTask/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name: newTaskName })
    });
    const message = await response.text();
    if (!response.ok) {
      throw new Error(message || 'Ошибка при изменении задачи');
    }
    console.log(message);
    loadFoldersAndTasks();
  }

  document.getElementById('taskForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const folderInput = document.getElementById('folderInput');
    const taskInput = document.getElementById('taskInput');
    const folderName = folderInput.value.trim();
    const taskName = taskInput.value.trim();
    if (folderName !== '' && taskName !== '') {
      addFolderAndTask(folderName, taskName);
      folderInput.value = '';
      taskInput.value = '';
    } else {
      alert('Пожалуйста, укажите имя папки и задачи');
    }
  });

  // Вызов функции загрузки папок и задач при загрузке страницы, если пользователь аутентифицирован
  if (token) {
    loadFoldersAndTasks();
  }
});
