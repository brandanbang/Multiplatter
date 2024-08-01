document.addEventListener('DOMContentLoaded', async () => {
    const recipeContainer = document.getElementById('recipes-container');

    try {
        const response = await fetch('/recipestable');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched data:', data);

        if (!data.data || !Array.isArray(data.data)) {
            console.error('Invalid data format');
            return;
        }

        data.data.forEach(recipe => {
            const [id, title, description, avgRating] = recipe;

            const recipeCard = document.createElement('div');
            recipeCard.classList.add('recipe-card');

            const img = document.createElement('img');
            img.alt = title || 'No title';

            const titleDiv = document.createElement('div');
            titleDiv.classList.add('title');
            titleDiv.textContent = title || 'No title';

            const ratingDiv = document.createElement('div');
            ratingDiv.classList.add('rating');
            ratingDiv.textContent = `Average Rating: ${avgRating !== null && avgRating !== undefined ? avgRating.toFixed(2) : 'N/A'}`;

            const heartButton = document.createElement('button');
            heartButton.classList.add('heart-button');
            heartButton.innerHTML = '❤';
            heartButton.addEventListener('click', async () => {
                const isLoggedIn = await checkLoginStatus();
                if (isLoggedIn) {
                    saveRecipe(id);
                } else {
                    alert('Please log in to save recipes');
                    window.location.href = '/signIn.html'; // Adjust the path to your login page
                }
            });

            recipeCard.appendChild(img);
            recipeCard.appendChild(titleDiv);
            recipeCard.appendChild(ratingDiv);
            recipeCard.appendChild(heartButton);

            recipeContainer.appendChild(recipeCard);
        });
    } catch (error) {
        console.error('Error fetching recipes:', error);
    }
});

async function saveRecipe(recipeId) {
    try {
        const response = await fetch('/saveRecipe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ recipeId }),
        });
        if (response.ok) {
            alert('Recipe saved successfully!');
        } else {
            throw new Error('Failed to save recipe');
        }
    } catch (error) {
        console.error('Error saving recipe:', error);
        alert('Failed to save recipe');
    }
}

// document.addEventListener('DOMContentLoaded', async () => {
//     const recipeContainer = document.getElementById('recipes-container');
//
//     try {
//         const response = await fetch('/recipestable');
//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }
//         const data = await response.json();
//         console.log('Fetched data:', data);
//
//         if (!data.data || !Array.isArray(data.data)) {
//             console.error('Invalid data format');
//             return;
//         }
//
//         data.data.forEach(recipe => {
//             const [id, title, description, avgRating] = recipe;
//
//             //console.log('Recipe:', { id, title, description, avgRating });
//
//             const recipeCard = document.createElement('div');
//             recipeCard.classList.add('recipe-card');
//
//
//             const img = document.createElement('img');
//             img.alt = title || 'No title';
//
//             const titleDiv = document.createElement('div');
//             titleDiv.classList.add('title');
//             titleDiv.textContent = title || 'No title';
//
//             const ratingDiv = document.createElement('div');
//             ratingDiv.classList.add('rating');
//             ratingDiv.textContent = `Average Rating: ${avgRating !== null && avgRating !== undefined ? avgRating.toFixed(2) : 'N/A'}`;
//
//             recipeCard.appendChild(img);
//             recipeCard.appendChild(titleDiv);
//             recipeCard.appendChild(ratingDiv);
//
//             recipeContainer.appendChild(recipeCard);
//         });
//     } catch (error) {
//         console.error('Error fetching recipes:', error);
//     }
// });



// document.addEventListener('DOMContentLoaded', async () => {
//     const recipeContainer = document.getElementById('recipes-container');
//
//     try {
//         const response = await fetch('/recipestable');
//         const data = await response.json();
//
//         data.data.forEach(recipe => {
//             const recipeCard = document.createElement('div');
//             recipeCard.classList.add('recipe-card');
//
//             const img = document.createElement('img');
//             //img.src = recipe.Picture ? `data:image/jpeg;base64,${recipe.Picture}` : 'default-image.jpg';
//             img.alt = recipe.Title;
//             console.log(recipe.Title);
//             const title = document.createElement('div');
//             title.classList.add('title');
//             title.textContent = recipe.Title;
//             console.log(recipe.AvgRating);
//             const rating = document.createElement('div');
//             rating.classList.add('rating');
//             rating.textContent = `Average Rating: ${recipe.AvgRating ? recipe.AvgRating.toFixed(2) : 'N/A'}`;
//             console.log(recipe.AvgRating);
//             recipeCard.appendChild(img);
//             recipeCard.appendChild(title);
//             recipeCard.appendChild(rating);
//
//             recipeContainer.appendChild(recipeCard);
//         });
//     } catch (error) {
//         console.error('Error fetching recipes:', error);
//     }
// });






