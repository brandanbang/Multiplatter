async function loadRecipeInfo(urlId) {
    const title = document.getElementById('title');
    // const img = document.getElementById('img');
    const description = document.getElementById('description');
    const id = document.getElementById('id');
    const creator = document.getElementById('creator');
    const category = document.getElementById('category');

    try {
        const response = await fetch(`/api/recipe/${urlId}`)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        } else {
            const recipe = await response.json();
            console.log('Fetched data:', recipe);

            const [rTitle, rImg, rDescription, rID, rCreator, rCategory] = recipe;

            title.textContent = rTitle || 'not found';
            // img. place holder for img
            description.textContent = rDescription || 'not found';
            id.textContent = rID || 'not found';
            creator.textContent = `Creator: ${rCreator}` || 'not found';
            category.textContent = rCategory || 'not found';

        }
    } catch (error) {
        console.error('Error fetching recipes:', error);
    }
}

async function loadRequiredItems(urlId) {
    const ingredientContainer = document.getElementById('ingredient-list');
    const equipmentContainer = document.getElementById('equipment-list');


    try {
        const response = await fetch(`/requiredItems/${urlId}`)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched data:', data);

        data.forEach(item => {
            const [name, description, quantity, unit, subs] = item;

            if (unit) { // not null => ingredient; else equipment
                const IngredientCard = document.createElement('div');
                IngredientCard.classList.add('ingredient-card');

                const Ingredient = document.createElement('div');
                Ingredient.classList.add('ingredient');
                Ingredient.textContent = `${quantity} ${unit} ${name}`;

                var row = 0;
                IngredientCard.style.gridRow = row++;
                IngredientCard.style.gridColumn = 1;
                IngredientCard.appendChild(Ingredient);

                const defPopup = document.createElement('div');
                defPopup.classList.add('explanationAndSubstitute');
                if (subs) {
                    defPopup.textContent = `${name}: ${description}\n Substitutes: ${subs}`;
                } else {
                    defPopup.textContent = `${name}: ${description}`;
                }

                IngredientCard.appendChild(defPopup);

                ingredientContainer.appendChild(IngredientCard);
            } else {
                const EquipmentCard = document.createElement('div');
                EquipmentCard.classList.add('equipment-card');

                const equipment = document.createElement('div');
                equipment.classList.add('equipment');
                equipment.textContent = `${name}: ${description}`;

                var row = 0;
                EquipmentCard.style.gridRow = row++;
                EquipmentCard.style.gridColumn = 1;
                EquipmentCard.appendChild(equipment);

                equipmentContainer.appendChild(EquipmentCard);
            }

        });
    } catch (error) {
        console.error('Error fetching recipes:', error);
    }
}

async function loadInstructions(urlId) {
    const instructionContainer = document.getElementById('instruction-list');

    try {
        const response = await fetch(`/instructions/${urlId}`)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched data:', data);

        data.forEach(instruction => {
            const [stepNum, step, Term, Definition] = instruction;

            const instructionCard = document.createElement('div');
            instructionCard.classList.add('instruction-card');

            const Step = document.createElement('div');
            Step.classList.add('step');
            Step.textContent = stepNum + ": " + step || 'missing step';

            instructionCard.style.gridRow = stepNum;
            instructionCard.style.gridColumn = 1;
            instructionCard.appendChild(Step);

            if (Term) { // not null
                const termPopup = document.createElement('div');
                termPopup.classList.add('term');
                termPopup.textContent = Term + ': ' + Definition;
                instructionCard.appendChild(termPopup);
            }

            instructionContainer.appendChild(instructionCard);
        });
    } catch (error) {
        console.error('Error fetching recipes:', error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const urlId = window.location.pathname.split('/').pop();

    loadRecipeInfo(urlId);
    loadRequiredItems(urlId);
    loadInstructions(urlId);
});