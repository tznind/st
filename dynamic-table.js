/**
 * Dynamic Table Module
 * Provides automatic table row management with add/delete functionality
 * and URL persistence for card-based tables
 *
 * Usage:
 * <table id="crew" data-dynamic-table>
 *   <thead>
 *     <tr>
 *       <th data-field="name">Name</th>
 *       <th data-field="tag">Tag</th>
 *       <th data-field="hp" data-type="number">HP</th>
 *     </tr>
 *   </thead>
 *   <tbody></tbody>
 * </table>
 * <button type="button" data-table-add="crew">+ Add Row</button>
 */

window.DynamicTable = (function() {
    'use strict';

    // Track initialized tables to prevent duplicate initialization
    const initializedTables = new Map();

    /**
     * Initialize all dynamic tables in a container
     * @param {HTMLElement} container - Container to search for tables (defaults to document)
     * @param {string} suffix - Optional suffix for duplicate card instances
     */
    function initializeTables(container = document, suffix = null) {
        const tables = container.querySelectorAll('[data-dynamic-table]');

        tables.forEach(table => {
            const tableId = table.id;
            if (!tableId) {
                console.error('Dynamic table missing id attribute:', table);
                return;
            }

            // Create unique key for this table instance
            const instanceKey = suffix ? `${tableId}_${suffix}` : tableId;

            // Skip if already initialized
            if (initializedTables.has(instanceKey)) {
                return;
            }

            console.log(`Initializing dynamic table: ${instanceKey}`);

            const manager = new TableManager(table, suffix);
            initializedTables.set(instanceKey, manager);

            // Initialize from URL
            manager.loadFromURL();

            // Find and wire up add button
            const addButton = document.querySelector(`[data-table-add="${tableId}"]`);
            if (addButton && !addButton.hasAttribute('data-dt-listener')) {
                addButton.addEventListener('click', () => manager.addRow());
                addButton.setAttribute('data-dt-listener', 'true');
            }
        });
    }

    /**
     * Manages a single dynamic table instance
     */
    class TableManager {
        constructor(table, suffix = null) {
            this.table = table;
            this.tableId = table.id;
            this.suffix = suffix;
            this.rowCount = 0;
            this.fields = this.extractFields();

            // Create tbody if it doesn't exist
            if (!this.table.querySelector('tbody')) {
                this.table.appendChild(document.createElement('tbody'));
            }

            this.tbody = this.table.querySelector('tbody');

            // Get max rows from attribute
            this.maxRows = parseInt(this.table.getAttribute('data-table-max')) || Infinity;

            console.log(`Table manager created for ${this.getPrefix()}, fields:`, this.fields);
        }

        /**
         * Get the ID prefix for this table instance
         * Format: tableId (no suffix) or tableId_suffix (with suffix)
         */
        getPrefix() {
            return this.suffix ? `${this.tableId}_${this.suffix}` : this.tableId;
        }

        /**
         * Get the count parameter name
         */
        getCountParam() {
            return `${this.getPrefix()}_cnt`;
        }

        /**
         * Extract field definitions from table header
         */
        extractFields() {
            const fields = [];
            const headers = this.table.querySelectorAll('thead th[data-field]');

            headers.forEach(th => {
                const field = {
                    name: th.getAttribute('data-field'),
                    type: th.getAttribute('data-type') || 'text',
                    readonly: th.hasAttribute('data-readonly'),
                    options: th.getAttribute('data-options'), // For select fields
                    label: th.textContent.trim()
                };
                fields.push(field);
            });

            return fields;
        }

        /**
         * Generate ID for a specific cell
         * Format: prefix_rowIndex_fieldName
         * Example: crew_0_name, crew_1_tag, crew_2_0_name (with suffix)
         */
        getCellId(rowIndex, fieldName) {
            return `${this.getPrefix()}_${rowIndex}_${fieldName}`;
        }

        /**
         * Create input element for a field
         */
        createInput(field, rowIndex) {
            const id = this.getCellId(rowIndex, field.name);
            let input;

            if (field.options) {
                // Create select dropdown
                input = document.createElement('select');
                input.id = id;

                // Add empty option
                const emptyOption = document.createElement('option');
                emptyOption.value = '';
                emptyOption.textContent = '';
                input.appendChild(emptyOption);

                // Add options from data-options (comma-separated)
                const options = field.options.split(',').map(o => o.trim());
                options.forEach(optValue => {
                    const option = document.createElement('option');
                    option.value = optValue;
                    option.textContent = optValue;
                    input.appendChild(option);
                });
            } else if (field.type === 'checkbox') {
                // Create checkbox
                input = document.createElement('input');
                input.type = 'checkbox';
                input.id = id;
            } else {
                // Create text/number input
                input = document.createElement('input');
                input.type = field.type;
                input.id = id;
                input.placeholder = field.label;

                if (field.type === 'number') {
                    input.style.width = '60px';
                }
            }

            if (field.readonly) {
                input.readOnly = true;
                input.setAttribute('readonly', 'true');
            }

            return input;
        }

        /**
         * Create a delete button for a row
         */
        createDeleteButton(rowIndex) {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = '×';
            button.className = 'dt-delete-row';
            button.title = 'Delete row';
            button.style.cssText = 'cursor: pointer; color: #dc2626; font-weight: bold; font-size: 18px; border: none; background: none; padding: 0 8px;';

            button.addEventListener('click', () => this.deleteRow(rowIndex));

            return button;
        }

        /**
         * Create a table row
         */
        createRow(rowIndex) {
            const tr = document.createElement('tr');
            tr.setAttribute('data-row-index', rowIndex);

            // Create cells for each field
            this.fields.forEach(field => {
                const td = document.createElement('td');
                const input = this.createInput(field, rowIndex);
                td.appendChild(input);
                tr.appendChild(td);
            });

            // Add delete button cell
            const deleteTd = document.createElement('td');
            deleteTd.appendChild(this.createDeleteButton(rowIndex));
            tr.appendChild(deleteTd);

            return tr;
        }

        /**
         * Add a new row
         */
        addRow() {
            if (this.rowCount >= this.maxRows) {
                alert(`Maximum ${this.maxRows} rows allowed`);
                return;
            }

            console.log(`Adding row ${this.rowCount} to ${this.getPrefix()}`);

            const row = this.createRow(this.rowCount);
            this.tbody.appendChild(row);
            this.rowCount++;

            // Update URL
            this.saveToURL();
        }

        /**
         * Delete a row and re-index remaining rows
         */
        deleteRow(indexToDelete) {
            console.log(`Deleting row ${indexToDelete} from ${this.getPrefix()}`);

            // Collect data from all rows except the deleted one
            const remainingData = [];
            for (let i = 0; i < this.rowCount; i++) {
                if (i === indexToDelete) continue;

                const rowData = {};
                this.fields.forEach(field => {
                    const input = document.getElementById(this.getCellId(i, field.name));
                    if (input) {
                        if (input.type === 'checkbox') {
                            rowData[field.name] = input.checked;
                        } else {
                            rowData[field.name] = input.value || '';
                        }
                    }
                });
                remainingData.push(rowData);
            }

            // Clear the table
            this.tbody.innerHTML = '';
            this.rowCount = 0;

            // Re-create rows with sequential indices
            remainingData.forEach(rowData => {
                const row = this.createRow(this.rowCount);
                this.tbody.appendChild(row);

                // Populate values
                this.fields.forEach(field => {
                    const input = document.getElementById(this.getCellId(this.rowCount, field.name));
                    if (input) {
                        if (input.type === 'checkbox') {
                            input.checked = rowData[field.name] || false;
                        } else {
                            input.value = rowData[field.name] || '';
                        }
                    }
                });

                this.rowCount++;
            });

            // Update URL (this will clean up deleted row params)
            this.saveToURL();
        }

        /**
         * Save table data to URL
         */
        saveToURL() {
            const params = new URLSearchParams(window.location.search);
            const prefix = this.getPrefix();

            // Clean up old parameters for this table
            const keysToDelete = [];
            for (const key of params.keys()) {
                if (key.startsWith(`${prefix}_`)) {
                    keysToDelete.push(key);
                }
            }
            keysToDelete.forEach(key => params.delete(key));

            // Save row count
            if (this.rowCount > 0) {
                params.set(this.getCountParam(), this.rowCount.toString());
            } else {
                params.delete(this.getCountParam());
            }

            // Save each row's data
            for (let i = 0; i < this.rowCount; i++) {
                this.fields.forEach(field => {
                    const input = document.getElementById(this.getCellId(i, field.name));
                    if (input) {
                        const paramName = this.getCellId(i, field.name);

                        if (input.type === 'checkbox') {
                            if (input.checked) {
                                params.set(paramName, '1');
                            } else {
                                params.delete(paramName);
                            }
                        } else if (input.value) {
                            params.set(paramName, input.value);
                        } else {
                            params.delete(paramName);
                        }
                    }
                });
            }

            // Update URL
            const newUrl = params.toString() ? '?' + params.toString() : window.location.pathname;
            window.history.replaceState({}, '', newUrl);

            console.log(`Saved ${this.rowCount} rows for ${prefix}`);
        }

        /**
         * Load table data from URL
         */
        loadFromURL() {
            const params = new URLSearchParams(window.location.search);
            const countParam = this.getCountParam();
            const savedCount = parseInt(params.get(countParam)) || 0;

            console.log(`Loading ${savedCount} rows for ${this.getPrefix()}`);

            // Clear existing rows
            this.tbody.innerHTML = '';
            this.rowCount = 0;

            // Create rows from URL data
            for (let i = 0; i < savedCount; i++) {
                const row = this.createRow(i);
                this.tbody.appendChild(row);

                // Populate values from URL
                this.fields.forEach(field => {
                    const input = document.getElementById(this.getCellId(i, field.name));
                    const paramName = this.getCellId(i, field.name);

                    if (input && params.has(paramName)) {
                        const value = params.get(paramName);

                        if (input.type === 'checkbox') {
                            input.checked = value === '1';
                        } else {
                            input.value = value;
                        }
                    }
                });

                this.rowCount++;
            }
        }
    }

    /**
     * Helper function for card initializers to use with duplicate support
     */
    function initializeInContainer(container, suffix) {
        initializeTables(container, suffix);
    }

    /**
     * Get TableManager instance for a table ID
     * @param {string} tableId - Full table ID (with suffix if applicable)
     * @returns {TableManager|null} TableManager instance or null
     */
    function getTableManager(tableId) {
        return initializedTables.get(tableId) || null;
    }

    /**
     * Add a row to a dynamic table with optional values
     * @param {string} tableId - Full table ID (with suffix if applicable)
     * @param {Object} values - Object with field values {fieldName: value}
     */
    function addRow(tableId, values = {}) {
        const manager = getTableManager(tableId);
        if (!manager) {
            console.warn(`DynamicTable.addRow: Table not found: ${tableId}`);
            return;
        }

        manager.addRow();

        // Populate values if provided
        if (Object.keys(values).length > 0) {
            const rowIndex = manager.rowCount - 1;
            manager.fields.forEach(field => {
                if (values.hasOwnProperty(field.name)) {
                    const input = document.getElementById(manager.getCellId(rowIndex, field.name));
                    if (input) {
                        if (input.type === 'checkbox') {
                            input.checked = !!values[field.name];
                        } else {
                            input.value = values[field.name];
                        }
                    }
                }
            });
            manager.saveToURL();
        }
    }

    /**
     * Clear all rows from a dynamic table
     * @param {string} tableId - Full table ID (with suffix if applicable)
     */
    function clearTable(tableId) {
        const manager = getTableManager(tableId);
        if (!manager) {
            console.warn(`DynamicTable.clearTable: Table not found: ${tableId}`);
            return;
        }

        manager.tbody.innerHTML = '';
        manager.rowCount = 0;
        manager.saveToURL();
    }

    /**
     * Get all data from a dynamic table
     * @param {string} tableId - Full table ID (with suffix if applicable)
     * @returns {Array} Array of row objects {fieldName: value}
     */
    function getTableData(tableId) {
        const manager = getTableManager(tableId);
        if (!manager) {
            console.warn(`DynamicTable.getTableData: Table not found: ${tableId}`);
            return [];
        }

        const data = [];
        for (let i = 0; i < manager.rowCount; i++) {
            const rowData = {};
            manager.fields.forEach(field => {
                const input = document.getElementById(manager.getCellId(i, field.name));
                if (input) {
                    if (input.type === 'checkbox') {
                        rowData[field.name] = input.checked;
                    } else {
                        rowData[field.name] = input.value || '';
                    }
                }
            });
            data.push(rowData);
        }
        return data;
    }

    /**
     * Set table data from an array of objects
     * @param {string} tableId - Full table ID (with suffix if applicable)
     * @param {Array} data - Array of row objects {fieldName: value}
     */
    function setTableData(tableId, data) {
        const manager = getTableManager(tableId);
        if (!manager) {
            console.warn(`DynamicTable.setTableData: Table not found: ${tableId}`);
            return;
        }

        // Clear existing rows
        manager.tbody.innerHTML = '';
        manager.rowCount = 0;

        // Add new rows
        data.forEach(rowData => {
            addRow(tableId, rowData);
        });
    }

    // Public API
    return {
        initializeTables,
        initializeInContainer,
        TableManager,
        addRow,
        clearTable,
        getTableData,
        setTableData
    };
})();

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.DynamicTable.initializeTables();
    });
} else {
    // DOM already ready
    window.DynamicTable.initializeTables();
}
