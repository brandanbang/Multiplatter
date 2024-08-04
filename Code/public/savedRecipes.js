document.addEventListener('DOMContentLoaded', async () => {
    const recipesContainer = document.getElementById('savedRecipesList'); // The container where recipes will be displayed
    const username = localStorage.getItem('username');

    if (!username) {
        window.location.href = 'signIn.html';
        return;
    }

    try {
        const response = await fetch(`/api/user/${username}/saved-recipes`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched saved recipes data:', data);

        if (!data.data || !Array.isArray(data.data)) {
            console.error('Invalid data format');
            return;
        }

        data.data.forEach(recipe => {
            const [id, title, description, avgRating] = recipe;

            const recipeCard = document.createElement('div');
            recipeCard.classList.add('recipe-card');

            const img = document.createElement('img');
            //img.src = photo || 'default-image.jpg';
            img.alt = title || 'No title';

            const titleDiv = document.createElement('div');
            titleDiv.classList.add('title');
            titleDiv.textContent = title || 'No title';


            const ratingDiv = document.createElement('div');
            ratingDiv.classList.add('rating');
            ratingDiv.textContent = `Average Rating: ${avgRating !== null && avgRating !== undefined ? avgRating.toFixed(2) : 'N/A'}`;
            //ratingDiv.textContent = `Average Rating: ${avgRating !== null && avgRating !== undefined ? avgRating.toFixed(2) : 'N/A'}`;

            // const removeButton = document.createElement('button');
            // removeButton.classList.add('remove-button');
            // removeButton.innerHTML = 'x';
            // heartButton.addEventListener('click', async () => {
            //
            //     //const isLoggedIn = await checkLoginStatus();
            //     if (!username) {
            //         alert('Please log in to save recipes');
            //         window.location.href = 'signIn.html';
            //         return;
            //     } else {
            //         saveRecipe(id, username);
            //     }
            //
            // });

            recipeCard.appendChild(img);
            recipeCard.appendChild(titleDiv);
            recipeCard.appendChild(ratingDiv);
            // recipeCard.appendChild(removeButton);

            recipesContainer.appendChild(recipeCard);
        });
    } catch (error) {
        console.error('Error fetching saved recipes:', error);
    }
});
