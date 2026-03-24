import { useState, useRef } from 'react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

export function ProductList({ products, onDelete, onUpdateStock, onEdit }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusProduct, setStatusProduct] = useState(null);
    const statusTemplateRef = useRef(null);
    const [stockFilter, setStockFilter] = useState('all');
    const [viewMode, setViewMode] = useState('list'); // 'grid' | 'list'

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStock = 
            stockFilter === 'all' ? true :
            stockFilter === 'in_stock' ? product.quantity > 0 :
            product.quantity === 0;
            
        return matchesSearch && matchesStock;
    });

    const handleGenerateStatus = async (product) => {
        setStatusProduct(product);
        toast.info('Generando imagen para estado... (puede tardar un momento)');
        
        setTimeout(async () => {
            if (statusTemplateRef.current) {
                try {
                    const canvas = await html2canvas(statusTemplateRef.current, {
                        scale: 1, 
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff',
                        width: 1080,
                        height: 1920,
                        windowWidth: 1080,
                        windowHeight: 1920
                    });
                    
                    canvas.toBlob((blob) => {
                        if (!blob) throw new Error("Could not create blob");
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        const shortName = product.name.substring(0, 15).replace(/\s+/g, '_');
                        a.download = `estado_${shortName}.png`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.success('¡Imagen descargada exitosamente!');
                        setStatusProduct(null); 
                    }, 'image/png');
                } catch (error) {
                    console.error(error);
                    toast.error('Error al generar la imagen. Intenta nuevamente.');
                    setStatusProduct(null);
                }
            }
        }, 1000); // 1 sec delay to ensure image loading 
    };

    if (products.length === 0) {
        return (
            <div className="empty-state card">
                <p>No hay productos en el inventario.</p>
                <small>Agrega uno nuevo usando el formulario.</small>
            </div>
        );
    }

    return (
        <div className="product-list-container">
            <div className="search-bar" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        flex: 1,
                        minWidth: '250px',
                        padding: '0.8rem',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-bg-card)',
                        color: 'var(--color-text)'
                    }}
                />
                <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                    style={{
                        padding: '0.8rem',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-bg-card)',
                        color: 'var(--color-text)',
                        minWidth: '180px',
                        cursor: 'pointer'
                    }}
                >
                    <option value="all" style={{ color: 'black' }}>Todos los productos</option>
                    <option value="in_stock" style={{ color: 'black' }}>Con stock</option>
                    <option value="out_of_stock" style={{ color: 'black' }}>Sin stock</option>
                </select>
                <div className="view-toggle">
                    <button 
                        className={viewMode === 'grid' ? 'active' : ''} 
                        onClick={() => setViewMode('grid')}
                        title="Vista Cuadrícula"
                    >
                        ⊞
                    </button>
                    <button 
                        className={viewMode === 'list' ? 'active' : ''} 
                        onClick={() => setViewMode('list')}
                        title="Vista Lista"
                    >
                        ☰
                    </button>
                </div>
            </div>

            {filteredProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                    No se encontraron productos que coincidan con "{searchTerm}"
                </div>
            ) : (
                <div className={viewMode === 'grid' ? 'product-grid' : 'product-list-view'}>
                    {filteredProducts.map(product => {

                        const minStock = product.minStock || product.min_stock || 5;
                        const isLowStock = product.quantity < minStock;

                        return (
                            <div key={product.id} className="product-card card">
                                {product.image && (
                                    <div className="product-image-container">
                                        <img src={product.image} alt={product.name} className="product-image" onError={(e) => e.target.style.display = 'none'} />
                                    </div>
                                )}

                                <div className="product-info">
                                    <div className="product-header">
                                        <h3>{product.name}</h3>
                                        <span className={`stock-badge ${isLowStock ? 'low-stock' : 'in-stock'}`}>
                                            {product.quantity} unid.
                                        </span>
                                    </div>

                                    <p className="product-price">${Number(product.price).toFixed(2)}</p>
                                    {product.cost > 0 && (
                                        <small className="product-cost">Costo: ${Number(product.cost).toFixed(2)}</small>
                                    )}

                                    {product.description && <p className="product-desc">{product.description}</p>}
                                </div>

                                <div className="product-actions">
                                    <button
                                        className="btn-icon"
                                        onClick={() => onUpdateStock(product.id, { quantity: product.quantity + 1 })}
                                        title="Aumentar Stock"
                                    >
                                        +
                                    </button>
                                    <button
                                        className="btn-icon"
                                        onClick={() => onUpdateStock(product.id, { quantity: Math.max(0, product.quantity - 1) })}
                                        title="Disminuir Stock"
                                    >
                                        -
                                    </button>
                                    <button
                                        className="btn-icon"
                                        onClick={() => onEdit(product)}
                                        title="Editar"
                                        style={{ fontSize: '1rem', width: 'auto', padding: '0 0.5rem' }}
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        className="btn-icon"
                                        onClick={() => handleGenerateStatus(product)}
                                        title="Crear Imagen para Estado"
                                        style={{ fontSize: '1rem', width: 'auto', padding: '0 0.5rem', color: '#8b5cf6', borderColor: 'rgba(139, 92, 246, 0.3)' }}
                                    >
                                        📸
                                    </button>
                                    <button
                                        className="btn-danger-outline"
                                        onClick={() => {
                                            if (confirm('¿Estás seguro de eliminar este producto?')) {
                                                onDelete(product.id);
                                                toast.success('Producto eliminado');
                                            }
                                        }}
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {statusProduct && (
                <div
                    ref={statusTemplateRef}
                    style={{
                        position: 'absolute',
                        left: '-9999px',
                        top: 0,
                        width: '1080px',
                        height: '1920px',
                        minWidth: '1080px',
                        minHeight: '1920px',
                        background: 'linear-gradient(135deg, #128C7E 0%, #25D366 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontFamily: 'Inter, sans-serif',
                        padding: '6rem',
                        boxSizing: 'border-box'
                    }}
                >
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.98)',
                        borderRadius: '60px',
                        padding: '5rem',
                        width: '880px',
                        maxWidth: '880px',
                        boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4rem',
                        boxSizing: 'border-box'
                    }}>
                        {statusProduct.image && (
                            <img 
                                src={statusProduct.image} 
                                alt={statusProduct.name} 
                                crossOrigin="anonymous"
                                style={{
                                    width: '100%',
                                    height: '900px',
                                    objectFit: 'contain',
                                    borderRadius: '30px'
                                }}
                            />
                        )}
                        <h1 style={{
                            color: '#111',
                            fontSize: '4.5rem',
                            textAlign: 'center',
                            margin: 0,
                            lineHeight: '1.2'
                        }}>
                            {statusProduct.name.length > 50 ? statusProduct.name.substring(0, 50) + '...' : statusProduct.name}
                        </h1>
                        <div style={{
                            background: '#128C7E',
                            color: 'white',
                            padding: '2rem 4rem',
                            borderRadius: '100px',
                            fontSize: '6rem',
                            fontWeight: 'bold',
                            marginTop: '2rem',
                            boxShadow: '0 10px 20px rgba(18,140,126,0.3)'
                        }}>
                            ${Number(statusProduct.price).toFixed(2)}
                        </div>
                        {statusProduct.quantity > 0 && (
                            <div style={{ color: '#25D366', fontSize: '3rem', fontWeight: 'bold', marginTop: '2rem' }}>
                                ✓ Stock Disponible
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
