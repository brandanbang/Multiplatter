async function updateDetails(event) {
    event.preventDefault();
    const username = localStorage.getItem('username');
    const password = document.getElementById('updateP').value;
    const oldPhoneNo = document.getElementById('updatePnO').value;
    const newPhoneNo = document.getElementById('updatePnN').value;
    const email = document.getElementById('updateE').value;
    const name = document.getElementById('updateN').value;
    const confirm = document.getElementById('updateC').value;
console.log(username,password,oldPhoneNo,newPhoneNo,email,name);
    const response = await fetch('/updateUserDetails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            Username: username,
            Password: password,
            OldPhoneNo: oldPhoneNo,
            NewPhoneNo: newPhoneNo,
            Email: email,
            Name: name,
            Confirm: confirm
        })
    });

    const responseData = await response.json();

    const messageElement = document.getElementById('updateResultMsgD');

    if (responseData.success) {
        messageElement.textContent = "Updated your details!";
    } else {
        messageElement.textContent = "error updating details! Either the password is wrong or email is already in use!";
    }
}

window.onload = function() {
    checkDbConnection();
    document.getElementById("updateform").addEventListener("submit",updateDetails);
};
