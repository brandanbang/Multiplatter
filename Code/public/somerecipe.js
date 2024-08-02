document.addEventListener('DOMContentLoaded', async () => {
    const urlId = window.location.pathname.split('/').pop();

    const title = document.getElementById('title');
    // const img = document.getElementById('img');
    const description = document.getElementById('description');
    const id = document.getElementById('id');
    const creator = document.getElementById('creator');
    const tag = document.getElementById('tag');

    console.log(urlId);

    try {
        const response = await fetch(`/api/recipe/${urlId}`)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        } else {
            const recipe = await response.json();
            console.log('Fetched data:', recipe);

            const [rTitle, rImg, rDescription, rID, rCreator, rTag] = recipe;

            console.log(recipe);

            title.textContent = rTitle || 'not found';
            // img. place holder for img
            description.textContent = rDescription || 'not found';
            id.textContent = rID || 'not found';
            creator.textContent = rCreator || 'not found';
            tag.textContent = rTag || 'not found';

        }
    } catch (error) {
        console.error('Error fetching recipes:', error);
    }
});