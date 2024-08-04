// TODO: Add filters for search bar

// function updateFilterOptions() {
//     const filterGroup = document.getElementById('filterGroup').value;
//     const filterOption = document.getElementById('filter');
//
//     filterOption.options.length = 0;
//
//     const categories = {
//         mealType: ['breakfast', 'lunch', 'dinner', 'dessert'],
//         cuisine: ['French', 'American', 'Japanese', 'Indian', 'Mexican', 'Italian', 'Thai', 'Chinese'],
//         taste: ['spicy', 'sweet', 'savoury', 'sour'],
//         diet: ['vegan', 'vegetarian', 'keto', 'gluten free', 'pescatarian']
//     };
//
//
//    for (const category of categories[filterGroup]) {
//            const options = document.createElement('option');
//            options.value = category;
//            options.textContent = category;
//            filterOption.appendChild(options);
//    }
// }
// }
document.addEventListener('DOMContentLoaded', () => {
    const filters = document.getElementById('filter');
    const addButton = document.getElementById('addFilterButton');

    function makefilterBar() {
        const filterBar = document.createElement('div');
        filterBar.className = 'filterBar';
        const andOr = document.createElement('select');
        andOr.add(new Option('AND','and'));
        andOr.add(new Option('OR','or'));
        filterBar.appendChild(andOr);

        const options = document.createElement('select');
        options.className = 'options';
        options.add(new Option('breakfast','breakfast'));
        options.add(new Option('lunch','lunch'));
        options.add(new Option('dinner','dinner'));
        options.add(new Option('dessert','dessert'));
        filterBar.appendChild(options);
        filters.appendChild(filterBar)

        return filterBar;
    }

    let i = 0; // Current number of filters added
    function addFilterBar() {

        if (i <4) {
            filters.appendChild(makefilterBar());
            i++;
        }
    }

    addButton.addEventListener('click', addFilterBar);

});
