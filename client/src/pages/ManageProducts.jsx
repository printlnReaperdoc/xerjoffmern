import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Header';

export default function ManageProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCollection, setFilterCollection] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    price: '',
    description: '',
    image: '',
    collection: 'mens',
    stock: '',
    notes: {
      top: '',
      middle: '',
      base: ''
    }
  });

  useEffect(() => {
    checkAdminAccess();
    fetchProducts();
  }, []);

  const checkAdminAccess = () => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      alert('Please login to access this page');
      navigate('/login');
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      if (!userData.isAdmin) {
        alert('Access denied. Admin privileges required.');
        navigate('/');
      }
    } catch (error) {
      navigate('/login');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      brand: '',
      price: '',
      description: '',
      image: '',
      collection: 'mens',
      stock: '',
      notes: { top: '', middle: '', base: '' }
    });
    setEditMode(false);
    setSelectedProduct(null);
  };

  const handleAddProduct = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditProduct = (product) => {
    setFormData({
      name: product.name,
      brand: product.brand,
      price: product.price,
      description: product.description,
      image: product.image,
      collection: product.collection,
      stock: product.stock || 0,
      notes: product.notes || { top: '', middle: '', base: '' }
    });
    setSelectedProduct(product);
    setEditMode(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editMode 
        ? `/api/products/${selectedProduct._id}` 
        : '/api/products';
      
      const method = editMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(editMode ? 'Product updated successfully!' : 'Product added successfully!');
        setShowModal(false);
        resetForm();
        fetchProducts();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product. Please try again.');
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      try {
        const response = await fetch(`/api/products/${productId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          alert('Product deleted successfully!');
          fetchProducts();
        } else {
          alert('Error deleting product');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product. Please try again.');
      }
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCollection = filterCollection === 'all' || product.collection === filterCollection;
    return matchesSearch && matchesCollection;
  });

  if (loading) {
    return (
      <div style={styles.container}>
        <Header cart={[]} />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Header cart={[]} />
      
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Products Management</h1>
            <p style={styles.subtitle}>Manage your perfume inventory</p>
          </div>
          <div style={styles.headerActions}>
            <button 
              style={styles.backButton}
              onClick={() => navigate('/admin')}
            >
              ← Back to Dashboard
            </button>
            <button 
              style={styles.addButton}
              onClick={handleAddProduct}
            >
              + Add New Product
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={styles.filterBar}>
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <select
            value={filterCollection}
            onChange={(e) => setFilterCollection(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Collections</option>
            <option value="mens">Men's</option>
            <option value="womens">Women's</option>
            <option value="unisex">Unisex</option>
          </select>
          <div style={styles.statsChip}>
            {filteredProducts.length} Products
          </div>
        </div>

        {/* Products Table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Image</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Brand</th>
                <th style={styles.th}>Collection</th>
                <th style={styles.th}>Price</th>
                <th style={styles.th}>Stock</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" style={styles.emptyState}>
                    No products found. Add your first product to get started!
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product._id} style={styles.tableRow}>
                    <td style={styles.td}>
                      <img 
                        src={product.image} 
                        alt={product.name}
                        style={styles.productImage}
                      />
                    </td>
                    <td style={styles.td}>
                      <div style={styles.productName}>{product.name}</div>
                    </td>
                    <td style={styles.td}>{product.brand}</td>
                    <td style={styles.td}>
                      <span style={styles.collectionBadge}>
                        {product.collection}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <strong>${product.price.toFixed(2)}</strong>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.stockBadge,
                        backgroundColor: product.stock > 10 ? '#d4edda' : '#f8d7da',
                        color: product.stock > 10 ? '#155724' : '#721c24'
                      }}>
                        {product.stock || 0}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionButtons}>
                        <button
                          style={styles.editBtn}
                          onClick={() => handleEditProduct(product)}
                        >
                          Edit
                        </button>
                        <button
                          style={styles.deleteBtn}
                          onClick={() => handleDeleteProduct(product._id, product.name)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editMode ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                style={styles.closeButton}
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            
            <div style={styles.formContainer}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Brand *</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Price ($) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    style={styles.input}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Stock *</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    style={styles.input}
                    min="0"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Collection *</label>
                  <select
                    name="collection"
                    value={formData.collection}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                  >
                    <option value="mens">Men's</option>
                    <option value="womens">Women's</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Image URL *</label>
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={{...styles.formGroup, gridColumn: '1 / -1'}}>
                  <label style={styles.label}>Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    style={{...styles.input, minHeight: '80px'}}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Top Notes</label>
                  <input
                    type="text"
                    name="notes.top"
                    value={formData.notes.top}
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder="e.g., Bergamot, Lemon"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Middle Notes</label>
                  <input
                    type="text"
                    name="notes.middle"
                    value={formData.notes.middle}
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder="e.g., Rose, Jasmine"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Base Notes</label>
                  <input
                    type="text"
                    name="notes.base"
                    value={formData.notes.base}
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder="e.g., Sandalwood, Musk"
                  />
                </div>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  style={styles.submitButton}
                  onClick={handleSubmit}
                >
                  {editMode ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "'Playfair Display', serif",
    backgroundColor: '#faf8f3',
    minHeight: '100vh',
  },
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '120px 2rem 4rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#666',
  },
  headerActions: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  backButton: {
    backgroundColor: 'white',
    color: '#8b6914',
    border: '2px solid #8b6914',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  addButton: {
    backgroundColor: '#8b6914',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  filterBar: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    marginBottom: '2rem',
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  searchInput: {
    flex: 1,
    minWidth: '200px',
    padding: '0.75rem 1rem',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '1rem',
    fontFamily: 'inherit',
  },
  filterSelect: {
    padding: '0.75rem 1rem',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  statsChip: {
    backgroundColor: '#8b6914',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.9rem',
    fontWeight: 600,
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
  },
  th: {
    padding: '1rem',
    textAlign: 'left',
    fontWeight: 600,
    color: '#333',
    borderBottom: '2px solid #e0e0e0',
  },
  tableRow: {
    borderBottom: '1px solid #f0f0f0',
    transition: 'background-color 0.2s',
  },
  td: {
    padding: '1rem',
    verticalAlign: 'middle',
  },
  productImage: {
    width: '60px',
    height: '60px',
    objectFit: 'cover',
    borderRadius: '8px',
  },
  productName: {
    fontWeight: 600,
    color: '#1a1a1a',
  },
  collectionBadge: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.85rem',
    backgroundColor: '#e8f4f8',
    color: '#0066cc',
    textTransform: 'capitalize',
  },
  stockBadge: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  actionButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  editBtn: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
  },
  deleteBtn: {
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    color: '#999',
    fontSize: '1.1rem',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    maxWidth: '800px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 2rem',
    borderBottom: '2px solid #f0f0f0',
  },
  modalTitle: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: '#1a1a1a',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '2rem',
    cursor: 'pointer',
    color: '#999',
    lineHeight: 1,
  },
  formContainer: {
    padding: '2rem',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#333',
    marginBottom: '0.5rem',
  },
  input: {
    padding: '0.75rem',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    transition: 'border-color 0.3s',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    paddingTop: '1rem',
    borderTop: '2px solid #f0f0f0',
  },
  cancelButton: {
    backgroundColor: 'white',
    color: '#666',
    border: '2px solid #e0e0e0',
    padding: '0.75rem 2rem',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  submitButton: {
    backgroundColor: '#8b6914',
    color: 'white',
    border: 'none',
    padding: '0.75rem 2rem',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '1rem',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f5e6d3',
    borderTop: '4px solid #8b6914',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

// Add CSS animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  table tr:hover {
    background-color: #f9f9f9;
  }
  
  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: #8b6914;
  }
  
  button:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }
  
  button:active {
    transform: translateY(0);
  }
`;
document.head.appendChild(styleSheet);