if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify([]));
}

function CreateAccount(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        alert('As senhas não coincidem!');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users'));
    const userExists = users.some(user => user.email === email);
    
    if (userExists) {
        alert('Este email já está cadastrado!');
        return;
    }
    
    const newUser = {
        username,
        email,
        password
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    alert('Conta criada com sucesso!');
    window.location.href = 'login.html';
}


function Login(event) {
    event.preventDefault();
    
    const email = document.querySelector('input[type="email"]').value;
    const password = document.querySelector('input[type="password"]').value;
    
    const users = JSON.parse(localStorage.getItem('users'));
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        window.location.href = 'home.html';
    } else {
        alert('Email ou senha incorretos!');
    }
}

const currentPage = window.location.pathname;

if (currentPage.includes('createaccount.html')) {
    document.querySelector('form').addEventListener('submit', CreateAccount);
}

if (currentPage.includes('login.html')) {
    document.querySelector('form').addEventListener('submit', Login);
}


