document.addEventListener('DOMContentLoaded', function() {
    // Состояние редактора
    let selectedElement = null;
    let isDragging = false;
    let offsetX, offsetY;
    let currentDraggedElement = null;
    const editor = document.getElementById('editor');
    const pageContainer = document.getElementById('page-container');
    const propertiesPanel = document.getElementById('properties-content');
    const settingsModal = document.getElementById('settings-modal');
    const modalForm = document.getElementById('modal-form');
    
    // История изменений для undo/redo
    const stateHistory = [];
    let currentStateIndex = -1;
    
    // Инициализация
    saveState();
    
    // Сохранение состояния
    function saveState() {
        // Удаляем все состояния после текущего
        stateHistory.splice(currentStateIndex + 1);
        
        // Сохраняем текущее состояние
        stateHistory.push({
            html: pageContainer.innerHTML,
            bgColor: pageContainer.style.backgroundColor
        });
        currentStateIndex = stateHistory.length - 1;
        
        // Ограничиваем историю 20 шагами
        if (stateHistory.length > 20) {
            stateHistory.shift();
            currentStateIndex--;
        }
    }
    
    // Отмена действия (Ctrl+Z)
    function undo() {
        if (currentStateIndex > 0) {
            currentStateIndex--;
            restoreState();
        }
    }
    
    // Повтор действия (Ctrl+X)
    function redo() {
        if (currentStateIndex < stateHistory.length - 1) {
            currentStateIndex++;
            restoreState();
        }
    }
    
    // Восстановление состояния
    function restoreState() {
        const state = stateHistory[currentStateIndex];
        pageContainer.innerHTML = state.html;
        pageContainer.style.backgroundColor = state.bgColor;
        rebindElements();
    }
    
    // Перепривязка событий после undo/redo
    function rebindElements() {
        document.querySelectorAll('.editor-element').forEach(element => {
            element.addEventListener('mousedown', startDrag);
            element.addEventListener('click', handleElementClick);
            
            const editBtn = element.querySelector('.edit-btn');
            if (editBtn) editBtn.addEventListener('click', () => openSettingsModal(element));
            
            const deleteBtn = element.querySelector('.delete-btn');
            if (deleteBtn) deleteBtn.addEventListener('click', handleDelete);
            
            const updateImageBtn = element.querySelector('.update-image-btn');
            if (updateImageBtn) updateImageBtn.addEventListener('click', updateImage);
            
            const updateButtonBtn = element.querySelector('.update-button-btn');
            if (updateButtonBtn) updateButtonBtn.addEventListener('click', updateButton);
        });
    }
    
    // Обработчики клавиш
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey) {
            if (e.key === 'z') {
                e.preventDefault();
                undo();
            } else if (e.key === 'x') {
                e.preventDefault();
                redo();
            }
        }
    });
    
    // Инициализация Drag and Drop для компонентов
    document.querySelectorAll('.component').forEach(comp => {
        comp.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('type', this.dataset.type);
        });
    });

    // Функции для перемещения элементов
    function startDrag(e) {
        if (e.target.closest('.element-actions')) return;
        
        const element = e.target.closest('.editor-element');
        if (!element) return;
        
        isDragging = true;
        currentDraggedElement = element;
        selectElement(element);
        
        // Вычисляем смещение курсора относительно элемента
        const rect = element.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        
        // Визуальные изменения при перетаскивании
        element.style.cursor = 'grabbing';
        element.style.opacity = '0.8';
        element.style.zIndex = '1000';
        
        document.addEventListener('mousemove', dragElement);
        document.addEventListener('mouseup', stopDrag);
    }
    
    function dragElement(e) {
        if (!isDragging || !currentDraggedElement) return;
        
        // Вычисляем новые координаты
        const editorRect = editor.getBoundingClientRect();
        let newX = e.clientX - editorRect.left - offsetX;
        let newY = e.clientY - editorRect.top - offsetY;
        
        // Ограничиваем перемещение в пределах редактора
        newX = Math.max(0, Math.min(newX, editorRect.width - currentDraggedElement.offsetWidth));
        newY = Math.max(0, Math.min(newY, editorRect.height - currentDraggedElement.offsetHeight));
        
        // Применяем новые координаты
        currentDraggedElement.style.left = `${newX}px`;
        currentDraggedElement.style.top = `${newY}px`;
    }
    
    function stopDrag() {
        if (!isDragging) return;
        
        if (currentDraggedElement) {
            currentDraggedElement.style.cursor = 'grab';
            currentDraggedElement.style.opacity = '1';
            currentDraggedElement.style.zIndex = '';
        }
        
        isDragging = false;
        currentDraggedElement = null;
        
        document.removeEventListener('mousemove', dragElement);
        document.removeEventListener('mouseup', stopDrag);
        
        saveState();
    }

    editor.addEventListener('dragover', e => e.preventDefault());
    editor.addEventListener('drop', e => {
        e.preventDefault();
        const type = e.dataTransfer.getData('type');
        createElement(type, e.clientX, e.clientY);
        saveState();
    });

    // Создание элементов
    function createElement(type, x, y) {
        const element = document.createElement('div');
        element.className = `editor-element element-${type}`;
        element.dataset.type = type;
        
        const rect = editor.getBoundingClientRect();
        const xPos = x - rect.left - 50;
        const yPos = y - rect.top - 50;
        
        switch(type) {
            case 'header':
                element.innerHTML = `
                    <h2 class="element-header" style="color:#333;font-size:32px">Новый заголовок</h2>
                    <div class="element-actions">
                        <button class="edit-btn"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                break;
            case 'text':
                element.innerHTML = `
                    <p class="element-text" style="color:#333;font-size:16px">Новый текст</p>
                    <div class="element-actions">
                        <button class="edit-btn"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                break;
            case 'image':
                element.innerHTML = `
                    <div class="element-image-container">
                        <img src="https://via.placeholder.com/400x300" alt="Изображение" class="element-image">
                        <div class="image-actions">
                            <input type="text" class="image-url-input" placeholder="Введите URL изображения">
                            <button class="update-image-btn">Обновить</button>
                        </div>
                    </div>
                    <div class="element-actions">
                        <button class="edit-btn"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                break;
            case 'button':
                element.innerHTML = `
                    <div class="element-button-container">
                        <a href="#" class="element-button">Кнопка</a>
                        <div class="button-actions">
                            <input type="text" class="button-link-input" placeholder="Введите URL ссылки">
                            <input type="text" class="button-text-input" placeholder="Введите текст кнопки">
                            <button class="update-button-btn">Обновить</button>
                        </div>
                    </div>
                    <div class="element-actions">
                        <button class="edit-btn"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                break;
        }
        
        element.style.position = 'absolute';
        element.style.left = `${xPos}px`;
        element.style.top = `${yPos}px`;
        element.style.cursor = 'grab';
        pageContainer.appendChild(element);
        
        // Назначение обработчиков
        addElementEventListeners(element);
        
        // Специальные обработчики для изображений и кнопок
        if (type === 'image') {
            element.querySelector('.update-image-btn').addEventListener('click', updateImage);
        }
        
        if (type === 'button') {
            element.querySelector('.update-button-btn').addEventListener('click', updateButton);
        }
        
        selectElement(element);
    }
    
    // Добавление обработчиков для элемента
    function addElementEventListeners(element) {
        element.addEventListener('mousedown', startDrag);
        element.addEventListener('click', handleElementClick);
        
        const editBtn = element.querySelector('.edit-btn');
        if (editBtn) editBtn.addEventListener('click', () => openSettingsModal(element));
        
        const deleteBtn = element.querySelector('.delete-btn');
        if (deleteBtn) deleteBtn.addEventListener('click', handleDelete);
    }
    
    // Обработчик клика по элементу
    function handleElementClick(e) {
        if (!e.target.closest('.element-actions')) {
            const element = e.target.closest('.editor-element');
            if (element) selectElement(element);
        }
    }
    
    // Обработчик удаления элемента
    function handleDelete() {
        const element = this.closest('.editor-element');
        if (element) {
            element.remove();
            selectedElement = null;
            showDefaultProperties();
            saveState();
        }
    }
    
    // Обновление изображения
    function updateImage() {
        const element = this.closest('.editor-element');
        const urlInput = element.querySelector('.image-url-input');
        const img = element.querySelector('.element-image');
        
        if (urlInput.value) {
            img.src = urlInput.value;
            saveState();
        }
    }
    
    // Обновление кнопки
    function updateButton() {
        const element = this.closest('.editor-element');
        const linkInput = element.querySelector('.button-link-input');
        const textInput = element.querySelector('.button-text-input');
        const button = element.querySelector('.element-button');
        
        if (linkInput.value) button.href = linkInput.value;
        if (textInput.value) button.textContent = textInput.value;
        saveState();
    }
    
    // Выбор элемента
    function selectElement(element) {
        if (isDragging) return;
        
        document.querySelectorAll('.editor-element').forEach(el => {
            el.classList.remove('selected');
        });
        
        selectedElement = element;
        element.classList.add('selected');
        showElementProperties(element);
    }
    
    // Панель свойств
    function showElementProperties(element) {
        const type = element.dataset.type;
        
        if (type === 'header') {
            const header = element.querySelector('.element-header');
            propertiesPanel.innerHTML = `
                <div class="form-group">
                    <label>Текст заголовка</label>
                    <input type="text" id="header-text" value="${header.textContent}">
                </div>
                <div class="form-group">
                    <label>Цвет</label>
                    <input type="color" id="header-color" value="${header.style.color || '#333333'}">
                </div>
                <div class="form-group">
                    <label>Размер (px)</label>
                    <input type="number" id="header-size" value="${parseInt(header.style.fontSize) || 32}">
                </div>
                <button id="apply-props">Применить</button>
                <button id="open-settings"><i class="fas fa-cog"></i> Доп. настройки</button>
            `;
            
            document.getElementById('apply-props').addEventListener('click', () => {
                header.textContent = document.getElementById('header-text').value;
                header.style.color = document.getElementById('header-color').value;
                header.style.fontSize = document.getElementById('header-size').value + 'px';
                saveState();
            });
            
            document.getElementById('open-settings').addEventListener('click', () => {
                openSettingsModal(element);
            });
        }
        
        if (type === 'text') {
            const text = element.querySelector('.element-text');
            propertiesPanel.innerHTML = `
                <div class="form-group">
                    <label>Текст</label>
                    <textarea id="text-content">${text.textContent}</textarea>
                </div>
                <div class="form-group">
                    <label>Цвет</label>
                    <input type="color" id="text-color" value="${text.style.color || '#333333'}">
                </div>
                <div class="form-group">
                    <label>Размер (px)</label>
                    <input type="number" id="text-size" value="${parseInt(text.style.fontSize) || 16}">
                </div>
                <button id="apply-props">Применить</button>
                <button id="open-settings"><i class="fas fa-cog"></i> Доп. настройки</button>
            `;
            
            document.getElementById('apply-props').addEventListener('click', () => {
                text.textContent = document.getElementById('text-content').value;
                text.style.color = document.getElementById('text-color').value;
                text.style.fontSize = document.getElementById('text-size').value + 'px';
                saveState();
            });
            
            document.getElementById('open-settings').addEventListener('click', () => {
                openSettingsModal(element);
            });
        }
        
        if (type === 'image' || type === 'button') {
            propertiesPanel.innerHTML = `
                <p>Используйте поля ввода на самом элементе</p>
                <button id="open-settings"><i class="fas fa-cog"></i> Доп. настройки</button>
            `;
            
            document.getElementById('open-settings').addEventListener('click', () => {
                openSettingsModal(element);
            });
        }
    }
    
    function showDefaultProperties() {
        propertiesPanel.innerHTML = `
            <p>Выберите элемент для редактирования</p>
            <div class="form-group">
                <label>Фон страницы</label>
                <input type="color" id="page-bg" value="#ffffff">
            </div>
        `;
        document.getElementById('page-bg').addEventListener('change', (e) => {
            pageContainer.style.backgroundColor = e.target.value;
            saveState();
        });
    }
    
    // Модальное окно настроек
    function openSettingsModal(element) {
        const type = element.dataset.type;
        let modalHTML = '';
        
        if (type === 'header') {
            const header = element.querySelector('.element-header');
            modalHTML = `
                <div class="form-group">
                    <label>Текст заголовка</label>
                    <input type="text" id="modal-header-text" value="${header.textContent}">
                </div>
                <div class="form-group">
                    <label>Цвет</label>
                    <input type="color" id="modal-header-color" value="${header.style.color || '#333333'}">
                </div>
                <div class="form-group">
                    <label>Размер (px)</label>
                    <input type="number" id="modal-header-size" value="${parseInt(header.style.fontSize) || 32}">
                </div>
            `;
        } else if (type === 'text') {
            const text = element.querySelector('.element-text');
            modalHTML = `
                <div class="form-group">
                    <label>Текст</label>
                    <textarea id="modal-text-content">${text.textContent}</textarea>
                </div>
                <div class="form-group">
                    <label>Цвет</label>
                    <input type="color" id="modal-text-color" value="${text.style.color || '#333333'}">
                </div>
                <div class="form-group">
                    <label>Размер (px)</label>
                    <input type="number" id="modal-text-size" value="${parseInt(text.style.fontSize) || 16}">
                </div>
            `;
        } else if (type === 'image') {
            const img = element.querySelector('.element-image');
            modalHTML = `
                <div class="form-group">
                    <label>URL изображения</label>
                    <input type="text" id="modal-image-src" value="${img.src}">
                </div>
                <div class="form-group">
                    <label>Альтернативный текст</label>
                    <input type="text" id="modal-image-alt" value="${img.alt}">
                </div>
            `;
        } else if (type === 'button') {
            const button = element.querySelector('.element-button');
            modalHTML = `
                <div class="form-group">
                    <label>Текст кнопки</label>
                    <input type="text" id="modal-button-text" value="${button.textContent}">
                </div>
                <div class="form-group">
                    <label>URL ссылки</label>
                    <input type="text" id="modal-button-href" value="${button.href}">
                </div>
            `;
        }
        
        modalForm.innerHTML = modalHTML;
        settingsModal.style.display = 'flex';
        
        document.getElementById('apply-changes').onclick = () => {
            if (type === 'header') {
                const header = element.querySelector('.element-header');
                header.textContent = document.getElementById('modal-header-text').value;
                header.style.color = document.getElementById('modal-header-color').value;
                header.style.fontSize = document.getElementById('modal-header-size').value + 'px';
            } else if (type === 'text') {
                const text = element.querySelector('.element-text');
                text.textContent = document.getElementById('modal-text-content').value;
                text.style.color = document.getElementById('modal-text-color').value;
                text.style.fontSize = document.getElementById('modal-text-size').value + 'px';
            } else if (type === 'image') {
                const img = element.querySelector('.element-image');
                img.src = document.getElementById('modal-image-src').value;
                img.alt = document.getElementById('modal-image-alt').value;
            } else if (type === 'button') {
                const button = element.querySelector('.element-button');
                button.textContent = document.getElementById('modal-button-text').value;
                button.href = document.getElementById('modal-button-href').value;
            }
            
            settingsModal.style.display = 'none';
            saveState();
        };
    }
    
    // Закрытие модального окна
    document.querySelector('.close-btn').addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });
    
    // Кнопки undo/redo в тулбаре
    document.getElementById('undo-btn').addEventListener('click', undo);
    document.getElementById('redo-btn').addEventListener('click', redo);
    
    // Инициализация
    showDefaultProperties();
    rebindElements();
});

document.getElementById('save-btn').addEventListener('click', function() {
    const projectData = {
        html: pageContainer.innerHTML,
        styles: pageContainer.style.cssText,
        timestamp: new Date().getTime()
    };
    
    localStorage.setItem('websiteProject', JSON.stringify(projectData));
    
    // Визуальная обратная связь
    const btn = this;
    btn.innerHTML = '<i class="fas fa-check"></i> Сохранено';
    setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-save"></i> Сохранить';
    }, 2000);
});

// Реализация кнопки Превью
document.getElementById('preview-btn').addEventListener('click', function() {
    const previewWindow = window.open('', '_blank');
    previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Превью сайта</title>
            <style>
                body { margin: 0; font-family: Arial, sans-serif; }
                .preview-container { 
                    max-width: 1200px; 
                    margin: 0 auto; 
                    padding: 20px; 
                }
            </style>
        </head>
        <body>
            <div class="preview-container">
                ${pageContainer.innerHTML}
            </div>
        </body>
        </html>
    `);
    previewWindow.document.close();
});

// Реализация кнопки Опубликовать
document.getElementById('publish-btn').addEventListener('click', function() {
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.className = 'publish-modal';
    modal.innerHTML = `
        <div class="publish-modal-content">
            <h3>Опубликовать сайт</h3>
            <p>Ваш сайт будет доступен по адресу:</p>
            <div class="publish-url" id="publish-url"></div>
            <button id="confirm-publish">Опубликовать</button>
            <button id="cancel-publish">Отмена</button>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Генерируем случайный ID проекта
    const projectId = 'project-' + Math.random().toString(36).substr(2, 9);
    document.getElementById('publish-url').textContent = 
        `https://mysitebuilder.com/${projectId}`;
    
    // Показываем модальное окно
    modal.style.display = 'flex';
    
    // Обработчики кнопок
    document.getElementById('confirm-publish').addEventListener('click', function() {
        const btn = this;
        btn.classList.add('publishing');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Публикация...';
        
        // Здесь должна быть реальная логика публикации на сервере
        // Для демо используем setTimeout
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.removeChild(modal);
            
            // Визуальная обратная связь
            const publishBtn = document.getElementById('publish-btn');
            publishBtn.innerHTML = '<i class="fas fa-check"></i> Опубликовано';
            setTimeout(() => {
                publishBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Опубликовать';
            }, 2000);
            
            // В реальном приложении здесь был бы редирект или уведомление
            alert(`Сайт опубликован! Доступен по адресу: https://mysitebuilder.com/${projectId}`);
        }, 1500);
    });
    
    document.getElementById('cancel-publish').addEventListener('click', function() {
        modal.style.display = 'none';
        document.body.removeChild(modal);
    });
});

// Улучшенный компонент для добавления фото
function createImageElement(x, y) {
    const element = document.createElement('div');
    element.className = 'editor-element element-image';
    element.dataset.type = 'image';
    
    const rect = editor.getBoundingClientRect();
    const xPos = x - rect.left - 50;
    const yPos = y - rect.top - 50;
    
    element.innerHTML = `
        <div class="image-upload-container">
            <label class="image-upload-label">
                <i class="fas fa-cloud-upload-alt"></i> Перетащите изображение или кликните для загрузки
                <input type="file" class="image-upload-input" accept="image/*">
            </label>
            <img class="image-preview">
        </div>
        <div class="element-actions">
            <button class="edit-btn"><i class="fas fa-edit"></i></button>
            <button class="delete-btn"><i class="fas fa-trash"></i></button>
        </div>
    `;
    
    element.style.position = 'absolute';
    element.style.left = `${xPos}px`;
    element.style.top = `${yPos}px`;
    pageContainer.appendChild(element);
    
    // Обработчик загрузки изображения
    const uploadInput = element.querySelector('.image-upload-input');
    const imagePreview = element.querySelector('.image-preview');
    
    uploadInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                imagePreview.src = event.target.result;
                imagePreview.style.display = 'block';
                saveState();
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Добавляем обработчики событий
    addElementEventListeners(element);
    selectElement(element);
    saveState();
}

document.getElementById('save-btn').addEventListener('click', function() {
    const project = {
        html: pageContainer.innerHTML,
        styles: document.querySelector('style').innerHTML,
        bgColor: pageContainer.style.backgroundColor,
        date: new Date()
    };
    
    localStorage.setItem('savedProject', JSON.stringify(project));
    
    // Визуальный фидбэк
    const originalText = this.innerHTML;
    this.innerHTML = '<i class="fas fa-check"></i> Сохранено!';
    setTimeout(() => {
        this.innerHTML = originalText;
    }, 2000);
});

// Превью проекта
document.getElementById('preview-btn').addEventListener('click', function() {
    const previewWindow = window.open('', '_blank');
    previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Превью проекта</title>
            <style>
                ${document.querySelector('style').innerHTML}
                body { background-color: ${pageContainer.style.backgroundColor}; }
            </style>
        </head>
        <body>
            ${pageContainer.innerHTML}
        </body>
        </html>
    `);
    previewWindow.document.close();
});

// Публикация проекта
document.getElementById('publish-btn').addEventListener('click', function() {
    // Генерируем случайный ID проекта
    const projectId = 'project-' + Math.random().toString(36).substr(2, 9);
    
    // В реальном приложении здесь был бы AJAX-запрос к серверу
    console.log('Публикация проекта с ID:', projectId);
    
    // Имитация публикации
    const originalText = this.innerHTML;
    this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Публикация...';
    
    setTimeout(() => {
        this.innerHTML = '<i class="fas fa-check"></i> Опубликовано!';
        alert(`Ваш сайт опубликован по адресу: https://mysitebuilder.com/${projectId}`);
        
        setTimeout(() => {
            this.innerHTML = originalText;
            this.disabled = false;
        }, 3000);
    }, 1500);
});
