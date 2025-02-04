const users = [];

export function addUser(user) {
    users.push(user);
}

export function findUser(email, password) {
    return users.find(user => user.email === email && user.password === password);
}

export default users;