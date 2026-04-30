/**
 * ESG Form Module - Complete ESG Data Entry
 * Based on QDB ESG Guidance Manual Pages 16-28
 */

class ESGFormManager {
    constructor() {
        this.form = document.getElementById('esgForm');
        this.currentYear = new Date().getFullYear();
        this.formData = null;
        this.autoSaveInterval = null;
        this.init();
    }

    init() {
        if (!this.form) return;
        
        this.setupEventListeners();
        this.setupAutoSave();
        this.loadExistingData();
        this.setupValidation();
        this.setupHelpTooltips();
        this.initializeCharts();
    }

    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Real-time validation
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.autoSave());
        });
        
        // Tab navigation
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.getAttribute('data-tab')));
        });
        
        // Help icons
        document.querySelectorAll('.help-icon').forEach(icon => {
            icon.addEventListener('click', (e) => this.showHelp(e.target));
        });
        
        // Year selector
        const yearSelect = document.getElementById('reportingYear');
        if (yearSelect) {
            yearSelect.addEventListener('change', () => this.loadExistingData());
        }
    }

    setupAutoSave() {
        // Auto-save every 30 seconds
        this.autoSaveInterval = setInterval(() => {
            if (this.hasUnsavedChanges()) {
                this.autoSave();
            }
        }, 30000);
        
        // Save before page unload
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
    }

    hasUnsavedChanges() {
        const inputs = this.form.querySelectorAll('input, select');
        for (let input of inputs) {
            if (input.type !== 'checkbox') {
                const originalValue = input.getAttribute('data-original');
                if (originalValue !== null && originalValue !== input.value) {
                    return true;
                }
            } else {
                const originalChecked = input.getAttribute('data-original-checked') === 'true';
                if (originalChecked !== input.checked) {
                    return true;
                }
            }
        }
        return false;
    }

    async autoSave() {
        const data = this.collectFormData();
        const savedData = localStorage.getItem('esg_form_draft');
        
        if (JSON.stringify(data) !== savedData) {
            localStorage.setItem('esg_form_draft', JSON.stringify(data));
            this.showAutoSaveIndicator();
        }
    }

    showAutoSaveIndicator() {
        let indicator = document.getElementById('autoSaveIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'autoSaveIndicator';
            indicator.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #2ecc71;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(indicator);
        }
        
        indicator.textContent = '💾 Draft saved';
        indicator.style.opacity = '1';
        
        setTimeout(() => {
            indicator.style.opacity = '0';
        }, 2000);
    }

    async loadExistingData() {
        const year = document.getElementById('reportingYear')?.value || this.currentYear;
        
        try {
            const data = await api.getESGData(year);
            if (data) {
                this.populateForm(data);
                this.formData = data;
                this.showToast('Data loaded successfully', 'success');
            } else {
                // Try to load from draft
                const draft = localStorage.getItem('esg_form_draft');
                if (draft) {
                    const draftData = JSON.parse(draft);
                    this.populateForm(draftData);
                    this.showToast('Loaded draft data', 'info');
                }
            }
        } catch (error) {
            if (error.message.includes('404')) {
                // No data found, that's fine
                console.log('No existing data for this year');
            } else {
                console.error('Error loading data:', error);
            }
        }
    }

    populateForm(data) {
        // Environment KPIs (Pages 16-19)
        this.setFieldValue('scope1', data.scope1_emissions);
        this.setFieldValue('scope2', data.scope2_emissions);
        this.setFieldValue('scope3', data.scope3_emissions);
        this.setFieldValue('electricity', data.total_electricity_kwh);
        this.setFieldValue('renewable', data.renewable_energy_percentage);
        this.setFieldValue('water', data.total_water_consumption);
        this.setFieldValue('waste', data.total_waste_generated);
        this.setFieldValue('wasteRecycled', data.waste_recycled_percentage);
        
        // Social KPIs (Pages 20-23)
        this.setFieldValue('employees', data.total_employees);
        this.setFieldValue('turnover', data.employee_turnover_rate);
        this.setFieldValue('ltifr', data.ltifr);
        this.setFieldValue('safetyTraining', data.safety_training_completion);
        this.setFieldValue('womenBoard', data.women_in_board_percentage);
        this.setFieldValue('qatarization', data.qatarization_percentage);
        
        // Governance KPIs (Pages 24-27)
        this.setFieldValue('antibribery', data.has_antibribery_policy, 'checkbox');
        this.setFieldValue('supplierScreened', data.supplier_esg_screened);
        this.setFieldValue('localProcurement', data.local_procurement_percentage);
        this.setFieldValue('dataBreaches', data.data_breaches_count);
        
        // Store original values for change detection
        this.storeOriginalValues();
    }

    setFieldValue(fieldId, value, type = 'input') {
        const field = document.getElementById(fieldId);
        if (!field) return;
        
        if (type === 'checkbox') {
            field.checked = value === true || value === 1;
        } else {
            field.value = value !== null && value !== undefined ? value : '';
        }
    }

    storeOriginalValues() {
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                input.setAttribute('data-original-checked', input.checked);
            } else {
                input.setAttribute('data-original', input.value);
            }
        });
    }

    collectFormData() {
        return {
            reporting_year: parseInt(document.getElementById('reportingYear')?.value || this.currentYear),
            // Environment
            scope1_emissions: this.getNumberValue('scope1'),
            scope2_emissions: this.getNumberValue('scope2'),
            scope3_emissions: this.getNumberValue('scope3'),
            total_electricity_kwh: this.getNumberValue('electricity'),
            renewable_energy_percentage: this.getNumberValue('renewable'),
            total_water_consumption: this.getNumberValue('water'),
            total_waste_generated: this.getNumberValue('waste'),
            waste_recycled_percentage: this.getNumberValue('wasteRecycled'),
            // Social
            total_employees: this.getIntValue('employees'),
            employee_turnover_rate: this.getNumberValue('turnover'),
            ltifr: this.getNumberValue('ltifr'),
            safety_training_completion: this.getNumberValue('safetyTraining'),
            women_in_board_percentage: this.getNumberValue('womenBoard'),
            qatarization_percentage: this.getNumberValue('qatarization'),
            // Governance
            has_antibribery_policy: this.getCheckboxValue('antibribery'),
            supplier_esg_screened: this.getNumberValue('supplierScreened'),
            local_procurement_percentage: this.getNumberValue('localProcurement'),
            data_breaches_count: this.getIntValue('dataBreaches')
        };
    }

    getNumberValue(id) {
        const field = document.getElementById(id);
        if (!field || !field.value) return 0;
        return parseFloat(field.value) || 0;
    }

    getIntValue(id) {
        const field = document.getElementById(id);
        if (!field || !field.value) return 0;
        return parseInt(field.value) || 0;
    }

    getCheckboxValue(id) {
        const field = document.getElementById(id);
        return field ? field.checked : false;
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            this.showToast('Please fix validation errors before submitting', 'error');
            return;
        }
        
        const submitBtn = this.form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '💾 Saving...';
        
        try {
            const data = this.collectFormData();
            const result = await api.saveESGData(data);
            
            // Clear draft
            localStorage.removeItem('esg_form_draft');
            this.storeOriginalValues();
            
            this.showToast('ESG data saved successfully!', 'success');
            
            // Update dashboard score if on dashboard page
            if (typeof updateDashboard === 'function') {
                updateDashboard();
            }
            
            // Show score improvement suggestion
            this.showScoreSuggestion(data);
            
        } catch (error) {
            console.error('Error saving ESG data:', error);
            this.showToast('Error saving data: ' + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    validateForm() {
        let isValid = true;
        const data = this.collectFormData();
        
        // Validate required fields based on manual
        if (data.total_employees < 0) {
            this.showFieldError('employees', 'Total employees cannot be negative');
            isValid = false;
        }
        
        if (data.renewable_energy_percentage > 100) {
            this.showFieldError('renewable', 'Renewable energy percentage cannot exceed 100%');
            isValid = false;
        }
        
        if (data.waste_recycled_percentage > 100) {
            this.showFieldError('wasteRecycled', 'Waste recycled percentage cannot exceed 100%');
            isValid = false;
        }
        
        if (data.women_in_board_percentage > 100) {
            this.showFieldError('womenBoard', 'Women in board percentage cannot exceed 100%');
            isValid = false;
        }
        
        return isValid;
    }

    validateField(field) {
        const id = field.id;
        const value = field.value;
        
        if (id === 'renewable' || id === 'wasteRecycled' || id === 'womenBoard' || id === 'qatarization') {
            if (value && (parseFloat(value) < 0 || parseFloat(value) > 100)) {
                this.showFieldError(id, 'Value must be between 0 and 100');
                return false;
            }
        }
        
        if (id === 'employees' && value && parseInt(value) < 0) {
            this.showFieldError(id, 'Employees cannot be negative');
            return false;
        }
        
        this.clearFieldError(id);
        return true;
    }

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) return;
        
        let errorDiv = field.parentElement.querySelector('.field-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.style.cssText = 'color: #e74c3c; font-size: 12px; margin-top: 5px;';
            field.parentElement.appendChild(errorDiv);
        }
        
        errorDiv.textContent = message;
        field.style.borderColor = '#e74c3c';
    }

    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return;
        
        const errorDiv = field.parentElement.querySelector('.field-error');
        if (errorDiv) errorDiv.remove();
        field.style.borderColor = '';
    }

    showScoreSuggestion(data) {
        // Calculate rough score and suggest improvements based on manual
        let suggestions = [];
        
        if (data.renewable_energy_percentage < 20) {
            suggestions.push('Increase renewable energy usage (Page 18) - SMEs with >20% renewable energy score higher');
        }
        
        if (data.waste_recycled_percentage < 50) {
            suggestions.push('Improve waste recycling (Page 19) - Target 50%+ recycling rate');
        }
        
        if (data.women_in_board_percentage < 30) {
            suggestions.push('Increase women in board positions (Page 23) - Industry best practice is 30%+');
        }
        
        if (!data.has_antibribery_policy) {
            suggestions.push('Establish anti-bribery policy (Page 24) - Required for governance score');
        }
        
        if (data.supplier_esg_screened < 50) {
            suggestions.push('Screen more suppliers for ESG compliance (Page 26)');
        }
        
        if (suggestions.length > 0) {
            setTimeout(() => {
                this.showToast('💡 Tip: ' + suggestions[0], 'info');
            }, 1500);
        }
    }

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });
        
        // Show selected tab
        const selectedTab = document.getElementById(tabName);
        if (selectedTab) selectedTab.style.display = 'block';
        
        // Update active tab styling
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-tab') === tabName) {
                tab.classList.add('active');
            }
        });
        
        // Save current tab preference
        localStorage.setItem('active_tab', tabName);
    }

    setupValidation() {
        // Add input masks and validation patterns
        const percentageFields = ['renewable', 'wasteRecycled', 'womenBoard', 'qatarization', 'supplierScreened', 'localProcurement'];
        percentageFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.setAttribute('min', '0');
                field.setAttribute('max', '100');
                field.setAttribute('step', '0.1');
            }
        });
        
        const emissionsFields = ['scope1', 'scope2', 'scope3'];
        emissionsFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.setAttribute('min', '0');
                field.setAttribute('step', '0.01');
            }
        });
    }

    setupHelpTooltips() {
        // Add help icons next to each KPI with reference to manual
        const helpTexts = {
            scope1: 'Direct emissions from sources owned by the company. See Page 16, Annexure 2 (Page 33)',
            scope2: 'Indirect emissions from purchased electricity. See Page 16',
            scope3: 'Value chain emissions. See Page 16 (optional for basic reporting)',
            ltifr: 'Lost Time Injury Frequency Rate per million hours worked. See Page 20',
            womenBoard: 'Percentage of board seats held by women. See Page 23, 25',
            qatarization: 'Local Qatari employees percentage. See Page 23',
            antibribery: 'Formal anti-bribery and corruption policy. See Page 24',
            supplierScreened: 'New suppliers screened for ESG criteria. See Page 26'
        };
        
        for (const [fieldId, helpText] of Object.entries(helpTexts)) {
            const field = document.getElementById(fieldId);
            if (field) {
                const helpIcon = document.createElement('span');
                helpIcon.textContent = ' ❓';
                helpIcon.style.cssText = 'cursor: pointer; color: #3498db; font-size: 14px; margin-left: 5px;';
                helpIcon.title = helpText;
                helpIcon.addEventListener('click', () => this.showHelpDialog(helpText));
                field.parentElement.appendChild(helpIcon);
            }
        }
    }

    showHelpDialog(text) {
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            z-index: 10000;
            max-width: 400px;
            text-align: center;
        `;
        dialog.innerHTML = `
            <p>${text}</p>
            <button onclick="this.parentElement.remove()" style="margin-top: 15px; padding: 8px 20px; background: #2ecc71; color: white; border: none; border-radius: 5px; cursor: pointer;">Got it</button>
        `;
        document.body.appendChild(dialog);
    }

    initializeCharts() {
        // If on dashboard, initialize comparison chart
        if (document.getElementById('esgComparisonChart')) {
            this.createComparisonChart();
        }
    }

    createComparisonChart() {
        // This would use Chart.js or similar - placeholder for now
        console.log('Chart initialization would go here');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#2ecc71' : '#3498db'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize form manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('esgForm')) {
        window.esgForm = new ESGFormManager();
    }
});