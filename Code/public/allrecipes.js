document.addEventListener('DOMContentLoaded', async () => {
    const recipeContainer = document.getElementById('recipe-container');

    const response = await fetch('/recipestable');
    const data =
        await response.json();

    data.data.forEach(recipe => {
        const recipeCard = document.createElement('div');
        recipeCard.classList.add('recipe-card');

        const img = document.createElement('img');
        img.src = recipe.Picture;
        img.alt = recipe.Title;

        const title = document.createElement('div');
        title.classList.add('title');
        title.textContent = recipe.Title;

        const rating = document.createElement('div');
        rating.classList.add('rating');
        rating.textContent = `Average Rating: ${recipe.AVGRATING.toFixed(2)}`;

        recipeCard.appendChild(img);
        recipeCard.appendChild(title);
        recipeCard.appendChild(rating);

        recipeContainer.appendChild(recipeCard);
    });
});