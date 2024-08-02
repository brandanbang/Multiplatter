document.addEventListener('DOMContentLoaded', async () => {
    // Get the username from the URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');

    if (username) {
        try {
            const response = await fetch(`/api/user/${username}`);
            if (response.ok) {
                const userData = await response.json();
                document.getElementById('username').textContent = userData.Username;
                document.getElementById('name').textContent = userData.Name;
                document.getElementById('email').textContent = userData.Email;
                document.getElementById('city').textContent = userData.City;
                document.getElementById('province').textContent = userData.ProvinceState;
                document.getElementById('phoneNumber').textContent = userData.PhoneNo;
            } else {
                console.error('User not found');
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
        }
    } else {
        console.error('No username specified');
    }
});
