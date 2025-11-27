/**
 * Shared rating scale component (5-point agreement scale).
 * Used on question and intro slides to keep visuals consistent.
 */
class RatingScaleComponent {
    /**
     * Create the rating scale table element.
     * @returns {HTMLTableElement}
     */
    static createTable() {
        const table = document.createElement('table');
        table.className = 'rating-scale';

        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>STRONGLY DISAGREE</th>
                <th>DISAGREE</th>
                <th>NEUTRAL</th>
                <th>AGREE</th>
                <th>STRONGLY AGREE</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        tbody.innerHTML = `
            <tr>
                <td>0%</td>
                <td>25%</td>
                <td>50%</td>
                <td>75%</td>
                <td>100%</td>
            </tr>
        `;
        table.appendChild(tbody);

        return table;
    }
}


