const apiBaseUrl = 'https://mi-dietetica-app.onrender.com/api';
const form = document.getElementById('add-product-form');
const supplierForm = document.getElementById('add-supplier-form');
const productList = document.getElementById('product-list');
const productSearch = document.getElementById('product-search');
const supplierFilter = document.getElementById('supplier-filter');
const supplierSelect = document.getElementById('product-supplier');
const supplierList = document.getElementById('supplier-list');
const toggleSupplierButton = document.getElementById('toggle-supplier-list');

let allProducts = [];
let allSuppliers = [];

form.addEventListener('submit', addProduct);
supplierForm.addEventListener('submit', addSupplier);
toggleSupplierButton.addEventListener('click', toggleSupplierList);
productSearch.addEventListener('input', searchProducts);
supplierFilter.addEventListener('change', filterBySupplier);

// Cargar productos y proveedores al iniciar
loadProducts();
loadSuppliers();

async function loadProducts() {
    try {
        const response = await fetch(`${apiBaseUrl}/products`);
        if (!response.ok) throw new Error('Error al cargar productos');
        allProducts = await response.json();
        displayProducts(allProducts); // Muestra los productos cargados
    } catch (error) {
        console.error(error);
    }
}

async function loadSuppliers() {
    try {
        const response = await fetch(`${apiBaseUrl}/suppliers`);
        if (!response.ok) throw new Error('Error al cargar proveedores');
        allSuppliers = await response.json();
        populateSupplierFilter(); // Actualiza el filtro de proveedores
        populateProductSupplierSelect(); // Llena el select de proveedores
    } catch (error) {
        console.error(error);
    }
}

function populateSupplierFilter() {
    supplierFilter.innerHTML = '<option value="">Todos los Proveedores</option>';
    supplierFilter.innerHTML += '<option value="sin-proveedor">Sin Proveedor</option>'; // Opción para filtrar sin proveedor

    allSuppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier._id;
        option.textContent = supplier.name;
        supplierFilter.appendChild(option);
    });
}

function populateProductSupplierSelect() {
    supplierSelect.innerHTML = '<option value="">Selecciona un proveedor</option>'; // Opción inicial
    allSuppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier._id;
        option.textContent = supplier.name;
        supplierSelect.appendChild(option);
    });
}


async function addProduct(event) {
    event.preventDefault();

    const name = document.getElementById('product-name').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const supplierId = supplierSelect.value;

    if (!supplierId || !name || isNaN(price)) {
        alert("Por favor, completa todos los campos correctamente.");
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, price, supplier: supplierId })
        });

        if (!response.ok) throw new Error('Error al agregar producto');

        form.reset();
        loadProducts(); // Recargar productos al agregar uno nuevo
        filterBySupplier(); // Actualizar filtro de proveedores
    } catch (error) {
        console.error('Error al agregar producto:', error);
    }
}


async function addSupplier(event) {
    event.preventDefault();
    const name = document.getElementById('supplier-name').value;

    if (!name) {
        alert("Por favor, ingresa un nombre para el proveedor.");
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/suppliers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        if (!response.ok) {
            const errorResponse = await response.text(); // Leer la respuesta como texto
            throw new Error(`Error al agregar proveedor: ${errorResponse}`);
        }

        supplierForm.reset();
        loadSuppliers(); // Recargar proveedores al agregar uno nuevo
    } catch (error) {
        console.error('Error al agregar proveedor:', error);
    }
}



async function displayProducts(products) {
    productList.innerHTML = '';

    products.forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.classList.add('product');
        productDiv.setAttribute('data-id', product._id);

        // Aquí es donde agregamos el atributo para el proveedor
        productDiv.setAttribute('data-supplier-id', product.supplier ? product.supplier._id : '');

        const supplierName = product.supplier ? product.supplier.name : 'Sin proveedor';
        const formattedPrice = product.price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

        productDiv.innerHTML = `
            <div class="product-details">
                <span class="product-name">${product.name}</span>
                <input type="text" value="${product.name}" class="edit-name" style="display:none;" />
                <span class="product-price">Precio: $${formattedPrice}</span>
                <input type="number" value="${product.price}" class="edit-price" style="display:none;" />
                <span class="supplier-name">Proveedor: ${supplierName}</span>
                <select class="product-supplier" style="display:none;" disabled>
                    <option value="">Selecciona un proveedor</option>
                </select>
            </div>
            <div class="product-actions">
                <button class="edit-button" onclick="toggleEdit('${product._id}', this)">Editar</button>
                <button onclick="increasePrice('${product._id}')">Aumentar Precio en 60%</button>
                <button onclick="deleteProduct('${product._id}')">Eliminar Producto</button>
            </div>
        `;

        const supplierSelect = productDiv.querySelector('.product-supplier');
        allSuppliers.forEach(supplier => {
            const option = document.createElement('option');
            option.value = supplier._id;
            option.textContent = supplier.name;
            if (supplier._id === product.supplier?._id) {
                option.selected = true;
            }
            supplierSelect.appendChild(option);
        });

        productList.appendChild(productDiv);
    });
}



async function toggleEdit(productId, button) {
    const productDiv = button.closest('.product');
    const nameInput = productDiv.querySelector('.edit-name');
    const priceInput = productDiv.querySelector('.edit-price');
    const supplierSelect = productDiv.querySelector('.product-supplier');
    const supplierNameSpan = productDiv.querySelector('.supplier-name');

    if (button.textContent === "Editar") {
        // Mostrar inputs y ocultar texto
        nameInput.style.display = "inline";
        priceInput.style.display = "inline";
        supplierSelect.style.display = "inline";
        supplierSelect.disabled = false;
        
        // Ocultar texto
        productDiv.querySelector('.product-name').style.display = "none";
        productDiv.querySelector('.product-price').style.display = "none";
        supplierNameSpan.style.display = "none";

        button.textContent = "Guardar";
        button.insertAdjacentHTML('afterend', '<button class="cancel-button" onclick="toggleEditCancel(this)">Cancelar</button>');
    } else {
        const updatedName = nameInput.value;
        const updatedPrice = parseFloat(priceInput.value);
        const updatedSupplierId = supplierSelect.value;

        // Obtener el proveedor actual
        const currentSupplierId = productDiv.getAttribute('data-supplier-id') || null;

        // Usar el proveedor actual si no se ha seleccionado uno nuevo
        const finalSupplierId = updatedSupplierId || currentSupplierId;

        // Guardar los cambios
        await updateProduct(productId, { name: updatedName, price: updatedPrice, supplier: finalSupplierId });

        // Ocultar inputs y mostrar texto
        nameInput.style.display = "none";
        priceInput.style.display = "none";
        supplierSelect.style.display = "none"; 
        supplierSelect.disabled = true;

        // Actualizar el nombre del proveedor en el span
        supplierNameSpan.textContent = `Proveedor: ${finalSupplierId ? supplierSelect.options[supplierSelect.selectedIndex].text : 'Sin proveedor'}`;
        supplierNameSpan.style.display = "inline";

        productDiv.querySelector('.product-name').textContent = updatedName;
        productDiv.querySelector('.product-price').textContent = `Precio: $${updatedPrice.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
        productDiv.querySelector('.product-name').style.display = "inline";
        productDiv.querySelector('.product-price').style.display = "inline";

        button.textContent = "Editar";

        const cancelButton = productDiv.querySelector('.cancel-button');
        if (cancelButton) {
            cancelButton.remove();
        }
    }
}


async function updateProduct(productId, data) {
    try {
        const response = await fetch(`${apiBaseUrl}/products/${productId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Error al editar el producto');
        loadProducts(); // Recargar productos después de editar
    } catch (error) {
        console.error('Error al editar el producto:', error);
    }
}

function toggleEditCancel(button) {
    const productDiv = button.closest('.product');
    const nameInput = productDiv.querySelector('.edit-name');
    const priceInput = productDiv.querySelector('.edit-price');
    const supplierSelect = productDiv.querySelector('.product-supplier');
    const supplierNameSpan = productDiv.querySelector('.supplier-name');
    const editButton = productDiv.querySelector('.edit-button');

    // Restaurar texto original
    const originalName = nameInput.value;
    const originalPrice = priceInput.value;
    const originalSupplierId = supplierSelect.value || null;

    // Mostrar texto de nombre y precio
    productDiv.querySelector('.product-name').textContent = originalName;
    productDiv.querySelector('.product-price').textContent = `Precio: $${parseFloat(originalPrice).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
    productDiv.querySelector('.product-name').style.display = "inline";
    productDiv.querySelector('.product-price').style.display = "inline";

    // Restaurar el nombre del proveedor
    supplierNameSpan.textContent = `Proveedor: ${originalSupplierId ? supplierSelect.options[supplierSelect.selectedIndex].text : 'Sin proveedor'}`;
    supplierNameSpan.style.display = "inline"; // Mostrar el nombre del proveedor

    // Ocultar inputs
    nameInput.style.display = "none";
    priceInput.style.display = "none";
    supplierSelect.style.display = "none"; // Ocultar el select de proveedores
    supplierSelect.disabled = true;

    editButton.textContent = "Editar";
    button.remove(); // Eliminar el botón de cancelar
}

async function increasePrice(productId) {
    const product = allProducts.find(p => p._id === productId);
    if (!product) {
        alert("Producto no encontrado.");
        return;
    }

    // Configurar el mensaje en el modal
    const messageElement = document.getElementById('increase-price-message');
    messageElement.textContent = `¿Estás seguro de que deseas aumentar el precio de ${product.name} en un 60%?`;

    // Mostrar el modal
    document.getElementById('increase-price-modal').style.display = 'flex';

    const confirmButton = document.getElementById('confirm-increase-price');
    const cancelButton = document.getElementById('cancel-increase-price');

    confirmButton.onclick = async () => {
        const newPrice = (product.price * 1.6).toFixed(2);

        try {
            const response = await fetch(`${apiBaseUrl}/products/${productId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ price: newPrice })
            });

            if (!response.ok) throw new Error('Error al aumentar el precio');

            loadProducts(); // Recargar productos después de aumentar el precio
        } catch (error) {
            console.error('Error al aumentar el precio:', error);
        } finally {
            document.getElementById('increase-price-modal').style.display = 'none';
        }
    };

    cancelButton.onclick = () => {
        document.getElementById('increase-price-modal').style.display = 'none';
    };
}


function displaySuppliers(suppliers) {
    supplierList.innerHTML = '';
    suppliers.forEach(supplier => {
        const supplierDiv = document.createElement('div');
        supplierDiv.classList.add('supplier');
        supplierDiv.innerHTML = `
            <span>${supplier.name}</span>
            <button class="delete-button" onclick="deleteSupplier('${supplier._id}')">Eliminar</button>
        `;
        supplierList.appendChild(supplierDiv);
    });
}

async function deleteSupplier(supplierId) {
    document.getElementById('delete-supplier-modal').style.display = 'flex';

    const confirmButton = document.getElementById('confirm-delete-supplier');
    const cancelButton = document.getElementById('cancel-delete-supplier');

    confirmButton.onclick = async () => {
        try {
            // Obtener el nombre del proveedor que se va a eliminar
            const supplierToDelete = allSuppliers.find(supplier => supplier._id === supplierId);
            if (!supplierToDelete) throw new Error('Proveedor no encontrado');

            // Obtener todos los productos
            const response = await fetch(`${apiBaseUrl}/products`);
            if (!response.ok) throw new Error('Error al obtener productos');

            const products = await response.json();

            // Filtrar productos que tienen este proveedor
            const productsToUpdate = products.filter(product => product.supplier && product.supplier._id === supplierId);

            // Actualizar solo los productos que tienen el proveedor que se va a eliminar
            if (productsToUpdate.length > 0) {
                const updatePromises = productsToUpdate.map(product => {
                    return fetch(`${apiBaseUrl}/products/${product._id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ supplier: null }) // Eliminar proveedor solo de estos productos
                    });
                });

                await Promise.all(updatePromises);
            }

            // Luego eliminar el proveedor
            const deleteResponse = await fetch(`${apiBaseUrl}/suppliers/${supplierId}`, {
                method: 'DELETE'
            });
            if (!deleteResponse.ok) throw new Error('Error al eliminar proveedor');

            // Actualizar la lista de proveedores
            allSuppliers = allSuppliers.filter(supplier => supplier._id !== supplierId);
            displaySuppliers(allSuppliers);

            // Actualizar el filtro de proveedores
            populateSupplierFilter();
            populateProductSupplierSelect();

            // Actualizar la lista de productos para que los que tenían el proveedor se muestren como "Sin proveedor"
            await loadProducts(); // Recargar productos para reflejar cambios
            filterBySupplier(); // Aplicar el filtro para mostrar los productos actualizados

        } catch (error) {
            console.error('Error al eliminar proveedor:', error);
        } finally {
            document.getElementById('delete-supplier-modal').style.display = 'none';
        }
    };

    cancelButton.onclick = () => {
        document.getElementById('delete-supplier-modal').style.display = 'none';
    };
}


function toggleSupplierList() {
    supplierList.style.display = supplierList.style.display === 'none' ? 'block' : 'none';
}

function searchProducts() {
    const filter = productSearch.value.toLowerCase();
    const products = document.querySelectorAll('.product');

    products.forEach(product => {
        const name = product.querySelector('.product-name').textContent.toLowerCase();
        product.style.display = name.includes(filter) ? '' : 'none';
    });
}


function filterBySupplier() {
    const selectedSupplier = supplierFilter.value;
    let filteredProducts;

    if (selectedSupplier === "") {
        filteredProducts = allProducts; // Mostrar todos los productos
    } else if (selectedSupplier === "sin-proveedor") {
        // Filtrar productos sin proveedor
        filteredProducts = allProducts.filter(product => !product.supplier);
    } else {
        // Filtrar por proveedor específico
        filteredProducts = allProducts.filter(product => product.supplier && product.supplier._id === selectedSupplier);
    }

    displayProducts(filteredProducts);
}


async function deleteProduct(productId) {
    document.getElementById('delete-product-modal').style.display = 'flex';

    const confirmButton = document.getElementById('confirm-delete-product');
    const cancelButton = document.getElementById('cancel-delete-product');

    confirmButton.onclick = async () => {
        try {
            const response = await fetch(`${apiBaseUrl}/products/${productId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Error al eliminar el producto');
            loadProducts(); // Recargar productos después de eliminar
        } catch (error) {
            console.error('Error al eliminar el producto:', error);
        } finally {
            document.getElementById('delete-product-modal').style.display = 'none';
        }
    };

    cancelButton.onclick = () => {
        document.getElementById('delete-product-modal').style.display = 'none';
    };
}

async function editProduct(productId) {
    const product = allProducts.find(p => p._id === productId);
    
    // Verificar si ya existe un formulario de edición y eliminarlo
    const existingEditForm = document.getElementById(`edit-form-${productId}`);
    if (existingEditForm) {
        existingEditForm.remove();
        return;
    }

    const productDiv = document.querySelector(`div[data-id='${productId}']`);
    const editForm = document.createElement('form');
    editForm.id = `edit-form-${productId}`;
    editForm.innerHTML = `
        <input type="text" value="${product.name}" id="edit-name-${productId}" required />
        <input type="number" value="${product.price}" id="edit-price-${productId}" required />
        <select id="edit-supplier-${productId}">
            <option value="">Selecciona un proveedor</option>
        </select>
        <button type="submit">Guardar</button>
        <button type="button" onclick="this.parentElement.remove();">Cancelar</button>
    `;

    // Llenar el select con proveedores actualizados
    await loadSuppliers(); // Asegúrate de tener proveedores actualizados
    allSuppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier._id;
        option.textContent = supplier.name;
        if (supplier._id === product.supplier?._id) {
            option.selected = true; // Marcar el proveedor actual como seleccionado
        }
        editForm.querySelector(`#edit-supplier-${productId}`).appendChild(option);
    });

    productDiv.appendChild(editForm);

    editForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const updatedName = document.getElementById(`edit-name-${productId}`).value;
        const updatedPrice = parseFloat(document.getElementById(`edit-price-${productId}`).value);
        const updatedSupplierId = document.getElementById(`edit-supplier-${productId}`).value || null; // Asignar null si no hay proveedor

        try {
            const response = await fetch(`${apiBaseUrl}/products/${productId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: updatedName, price: updatedPrice, supplier: updatedSupplierId })
            });

            if (!response.ok) throw new Error('Error al editar el producto');
            loadProducts(); // Recargar productos después de editar
        } catch (error) {
            console.error('Error al editar el producto:', error);
        }
    });
}















