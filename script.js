document.addEventListener('DOMContentLoaded', function() {
    // Переменные для хранения состояния
    let selectedElement = null;
    let draggedElement = null;
    
    // Элементы интерфейса
    const editor = document.getElementById('editor');
    const pageContainer = document.getElementById('page-container');
    const components = document.querySelectorAll('.component');
    const propertiesPanel = document.getElementById('properties-content');
    const settingsModal = document.getElementById('settings-modal');
    const closeBtn = document.querySelector('.close-btn');
    const applyChangesBtn = document.getElementById('apply-changes');
    const modalForm = document.getElementById('modal-form');
    
    // Обработчики событий для компонентов
    components.forEach(component => {
        component.addEventListener('dragstart', dragStart);
        component.addEventListener('dragend', dragEnd);
    });
    
    // Обработчики событий для области редактора
    editor.addEventListener('dragover', dragOver);
    editor.addEventListener('dragenter', dragEnter);
    editor.addEventListener('dragleave', dragLeave);
    editor.addEventListener('drop', drop);
    
    // Обработчики для модального окна
    closeBtn.addEventListener('click', closeModal);
    applyChangesBtn.addEventListener('click', applyChanges);
    window.addEventListener('click', outsideClick);
    
    // Кнопки тулбара
    document.getElementById('save-btn').addEventListener('click', saveProject);
    document.getElementById('preview-btn').addEventListener('click', previewProject);
    document.getElementById('publish-btn').addEventListener('click', publishProject);
    
    // Функции для drag and drop
    function dragStart(e) {
        draggedElement = this;
        e.dataTransfer.setData('text/plain', this.dataset.type);
        setTimeout(() => this.style.opacity = '0.4', 0);
    }
    
    function dragEnd() {
        this.style.opacity = '1';
        draggedElement = null;
    }
    
    function dragOver(e) {
        e.preventDefault();
    }
    
    function dragEnter(e) {
        e.preventDefault();
    }
    
    function dragLeave() {
        // Можно добавить визуальную обратную связь
    }
    
    function drop(e) {
        e.preventDefault();
        const type = e.dataTransfer.getData('text/plain');
        createElement(type, e.clientX, e.clientY);
    }
    
    // Создание нового элемента
    function createElement(type, x, y) {
        const rect = editor.getBoundingClientRect();
        const xPos = x - rect.left;
        const yPos = y - rect.top;
        
        const element = document.createElement('div');
        element.className = `editor-element element-${type}`;
        element.dataset.type = type;
        
        // Создаем содержимое в зависимости от типа элемента
        switch(type) {
            case 'header':
                element.innerHTML = `
                    <div class="element-content">
                        <h2 class="element-header">Новый заголовок</h2>
                    </div>
                    <div class="element-actions">
                        <button class="edit-btn" title="Редактировать"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn" title="Удалить"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                break;
            case 'text':
                element.innerHTML = `
                    <div class="element-content">
                        <p class="element-text">Здесь будет ваш текст. Вы можете редактировать его двойным кликом или через панель свойств.</p>
                    </div>
                    <div class="element-actions">
                        <button class="edit-btn" title="Редактировать"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn" title="Удалить"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                break;
            case 'image':
                element.innerHTML = `
                    <div class="element-content">
                        <img src="https://via.placeholder.com/400x300" alt="Изображение" class="element-image">
                    </div>
                    <div class="element-actions">
                        <button class="edit-btn" title="Редактировать"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn" title="Удалить"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                break;
            case 'button':
                element.innerHTML = `
                    <div class="element-content">
                        <a href="#" class="element-button">Кнопка</a>
                    </div>
                    <div class="element-actions">
                        <button class="edit-btn" title="Редактировать"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn" title="Удалить"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                break;
            case 'video':
                element.innerHTML = `
                    <div class="element-content">
                        <div class="element-video"></div>
                    </div>
                    <div class="element-actions">
                        <button class="edit-btn" title="Редактировать"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn" title="Удалить"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                break;
            case 'columns':
                element.innerHTML = `
                    <div class="element-content element-columns">
                        <div class="column" data-col="1"></div>
                        <div class="column" data-col="2"></div>
                    </div>
                    <div class="element-actions">
                        <button class="edit-btn" title="Редактировать"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn" title="Удалить"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                break;
        }
        
        // Добавляем элемент на страницу
        pageContainer.appendChild(element);
        
        // Позиционируем элемент
        element.style.position = 'absolute';
        element.style.left = `${xPos - 50}px`;
        element.style.top = `${yPos - 50}px`;
        
        // Добавляем обработчики событий для нового элемента
        addElementEventListeners(element);
        
        // Выбираем новый элемент
        selectElement(element);
    }
    
    // Добавление обработчиков событий для элемента
    function addElementEventListeners(element) {
        // Выбор элемента
        element.addEventListener('click', function(e) {
            if (e.target.closest('.element-actions')) return;
            selectElement(this);
            e.stopPropagation();
        });
        
        // Удаление элемента
        const deleteBtn = element.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                this.closest('.editor-element').remove();
                selectedElement = null;
                showDefaultProperties();
            });
        }
        
        // Редактирование элемента
        const editBtn = element.querySelector('.edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', function() {
                openSettingsModal(this.closest('.editor-element'));
            });
        }
        
        // Редактирование текста двойным кликом
        if (element.dataset.type === 'text' || element.dataset.type === 'header') {
            const content = element.querySelector('.element-content');
            content.addEventListener('dblclick', function() {
                openSettingsModal(element);
            });
        }
    }
    
    // Выбор элемента
    function selectElement(element) {
        // Снимаем выделение с предыдущего элемента
        if (selectedElement) {
            selectedElement.classList.remove('selected');
        }
        
        // Выделяем новый элемент
        selectedElement = element;
        element.classList.add('selected');
        
        // Показываем свойства элемента
        showElementProperties(element);
    }
    
    // Показ свойств элемента
    function showElementProperties(element) {
        const type = element.dataset.type;
        let propertiesHTML = '';
        
        switch(type) {
            case 'header':
                const headerText = element.querySelector('.element-header').textContent;
                propertiesHTML = `
                    <div class="form-group">
                        <label for="header-text">Текст заголовка</label>
                        <input type="text" id="header-text" value="${headerText}">
                    </div>
                    <div class="form-group">
                        <label for="header-level">Уровень заголовка</label>
                        <select id="header-level">
                            <option value="h1">H1</option>
                            <option value="h2">H2</option>
                            <option value="h3">H3</option>
                            <option value="h4">H4</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="header-align">Выравнивание</label>
                        <select id="header-align">
                            <option value="left">По левому краю</option>
                            <option value="center">По центру</option>
                            <option value="right">По правому краю</option>
                        </select>
                    </div>
                `;
                break;
            case 'text':
                const textContent = element.querySelector('.element-text').textContent;
                propertiesHTML = `
                    <div class="form-group">
                        <label for="text-content">Текст</label>
                        <textarea id="text-content" rows="5">${textContent}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="text-align">Выравнивание</label>
                        <select id="text-align">
                            <option value="left">По левому краю</option>
                            <option value="center">По центру</option>
                            <option value="right">По правому краю</option>
                            <option value="justify">По ширине</option>
                        </select>
                    </div>
                `;
                break;
            case 'image':
                const imgSrc = element.querySelector('.element-image').src;
                propertiesHTML = `
                    <div class="form-group">
                        <label for="image-src">URL изображения</label>
                        <input type="text" id="image-src" value="${imgSrc}">
                    </div>
                    <div class="form-group">
                        <label for="image-alt">Альтернативный текст</label>
                        <input type="text" id="image-alt" placeholder="Описание изображения">
                    </div>
                    <div class="form-group">
                        <label for="image-width">Ширина (px или %)</label>
                        <input type="text" id="image-width" placeholder="например, 100% или 300px">
                    </div>
                `;
                break;
            case 'button':
                const buttonText = element.querySelector('.element-button').textContent;
                propertiesHTML = `
                    <div class="form-group">
                        <label for="button-text">Текст кнопки</label>
                        <input type="text" id="button-text" value="${buttonText}">
                    </div>
                    <div class="form-group">
                        <label for="button-link">Ссылка</label>
                        <input type="text" id="button-link" placeholder="https://example.com">
                    </div>
                    <div class="form-group">
                        <label for="button-color">Цвет</label>
                        <input type="color" id="button-color" value="#3498db">
                    </div>
                `;
                break;
            case 'video':
                propertiesHTML = `
                    <div class="form-group">
                        <label for="video-src">URL видео (YouTube, Vimeo)</label>
                        <input type="text" id="video-src" placeholder="https://www.youtube.com/embed/...">
                    </div>
                `;
                break;
            case 'columns':
                propertiesHTML = `
                    <div class="form-group">
                        <label for="columns-count">Количество колонок</label>
                        <select id="columns-count">
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="columns-gap">Расстояние между колонками (px)</label>
                        <input type="number" id="columns-gap" value="20" min="0">
                    </div>
                `;
                break;
        }
        
        propertiesPanel.innerHTML = propertiesHTML;
        
        // Добавляем кнопку для открытия расширенных настроек
        propertiesPanel.innerHTML += `<button id="open-settings" class="settings-btn"><i class="fas fa-cog"></i> Дополнительные настройки</button>`;
        
        document.getElementById('open-settings').addEventListener('click', function() {
            openSettingsModal(element);
        });
    }
    
    // Показ стандартных свойств (когда элемент не выбран)
    function showDefaultProperties() {
        propertiesPanel.innerHTML = `
            <p>Выберите элемент для редактирования</p>
            <div class="form-group">
                <label for="page-title">Название страницы</label>
                <input type="text" id="page-title" placeholder="Моя страница">
            </div>
            <div class="form-group">
                <label for="page-bg">Фон страницы</label>
                <input type="color" id="page-bg" value="#ffffff">
            </div>
        `;
    }
    
    // Работа с модальным окном
    function openSettingsModal(element) {
        const type = element.dataset.type;
        let modalHTML = '';
        
        switch(type) {
            case 'header':
                const header = element.querySelector('.element-header');
                modalHTML = `
                    <div class="form-group">
                        <label for="modal-header-text">Текст заголовка</label>
                        <input type="text" id="modal-header-text" value="${header.textContent}">
                    </div>
                    <div class="form-group">
                        <label for="modal-header-color">Цвет текста</label>
                        <input type="color" id="modal-header-color" value="#333333">
                    </div>
                    <div class="form-group">
                        <label for="modal-header-size">Размер шрифта (px)</label>
                        <input type="number" id="modal-header-size" value="32" min="10" max="72">
                    </div>
                `;
                break;
            case 'text':
                const text = element.querySelector('.element-text');
                modalHTML = `
                    <div class="form-group">
                        <label for="modal-text-content">Текст</label>
                        <textarea id="modal-text-content" rows="8">${text.textContent}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="modal-text-color">Цвет текста</label>
                        <input type="color" id="modal-text-color" value="#333333">
                    </div>
                    <div class="form-group">
                        <label for="modal-text-size">Размер шрифта (px)</label>
                        <input type="number" id="modal-text-size" value="16" min="10" max="24">
                    </div>
                `;
                break;
            // Добавьте другие типы элементов по аналогии
            default:
                modalHTML = `<p>Расширенные настройки для этого элемента пока недоступны.</p>`;
        }
        
        modalForm.innerHTML = modalHTML;
        settingsModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    function closeModal() {
        settingsModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    function outsideClick(e) {
        if (e.target === settingsModal) {
            closeModal();
        }
    }
    
    function applyChanges() {
        if (!selectedElement) return;
        
        const type = selectedElement.dataset.type;
        
        switch(type) {
            case 'header':
                const headerText = document.getElementById('modal-header-text').value;
                const headerColor = document.getElementById('modal-header-color').value;
                const headerSize = document.getElementById('modal-header-size').value;
                
                const header = selectedElement.querySelector('.element-header');
                header.textContent = headerText;
                header.style.color = headerColor;
                header.style.fontSize = `${headerSize}px`;
                break;
            case 'text':
                const textContent = document.getElementById('modal-text-content').value;
                const textColor = document.getElementById('modal-text-color').value;
                const textSize = document.getElementById('modal-text-size').value;
                
                const text = selectedElement.querySelector('.element-text');
                text.textContent = textContent;
                text.style.color = textColor;
                text.style.fontSize = `${textSize}px`;
                break;
            // Добавьте обработку других типов элементов
        }
        
        closeModal();
    }
    
    // Функции для кнопок тулбара
    function saveProject() {
        alert('Функция сохранения проекта будет реализована позже');
    }
    
    function previewProject() {
        alert('Функция предпросмотра будет реализована позже');
    }
    
    function publishProject() {
        alert('Функция публикации будет реализована позже');
    }
    
    // Инициализация
    showDefaultProperties();
    
    // Обработчик клика вне элементов (снятие выделения)
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.editor-element') && !e.target.closest('.components-panel')) {
            if (selectedElement) {
                selectedElement.classList.remove('selected');
                selectedElement = null;
                showDefaultProperties();
            }
        }
    });
});