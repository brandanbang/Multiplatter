// document.addEventListener('DOMContentLoaded', async () => {
//     const recipeContainer = document.getElementById('recipes-container');
//
//     const response = await fetch('/recipestable');
//     const data =
//         await response.json();
//
//     data.data.forEach(recipe => {
//         const recipeCard = document.createElement('div');
//         recipeCard.classList.add('recipe-card');
//
//         const img = document.createElement('img');
//         //img.src = recipe.Picture;
//         img.alt = recipe.Title;
//
//         const title = document.createElement('div');
//         title.classList.add('title');
//         title.textContent = recipe.Title;
//
//         const rating = document.createElement('div');
//         rating.classList.add('rating');
//         rating.textContent = `Average Rating: ${recipe.AVGRATING.toFixed(2)}`;
//
//         recipeCard.appendChild(img);
//         recipeCard.appendChild(title);
//         recipeCard.appendChild(rating);
//
//         recipeContainer.appendChild(recipeCard);
//     });
// });

//
//
document.addEventListener('DOMContentLoaded', async () => {
    const recipeContainer = document.getElementById('recipes-container');

    try {
        const response = await fetch('/recipestable');
        const data = await response.json();

        data.data.forEach(recipe => {
            const recipeCard = document.createElement('div');
            recipeCard.classList.add('recipe-card');

            const img = document.createElement('img');
            //img.src = recipe.Picture ? `data:image/jpeg;base64,${recipe.Picture}` : 'default-image.jpg';
            img.alt = recipe.Title;
            console.log(recipe.Title);
            const title = document.createElement('div');
            title.classList.add('title');
            title.textContent = recipe.Title;
            console.log(recipe.AvgRating);
            const rating = document.createElement('div');
            rating.classList.add('rating');
            rating.textContent = `Average Rating: ${recipe.AvgRating ? recipe.AvgRating.toFixed(2) : 'N/A'}`;
            console.log(recipe.AvgRating);
            recipeCard.appendChild(img);
            recipeCard.appendChild(title);
            recipeCard.appendChild(rating);

            recipeContainer.appendChild(recipeCard);
        });
    } catch (error) {
        console.error('Error fetching recipes:', error);
    }
});
