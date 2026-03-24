import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { WhatsAppButton } from './WhatsAppButton';

export function CatalogView({ onRequestLogin }) {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [stockFilter, setStockFilter] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);


    useEffect(() => {
        fetchPublicProducts();
    }, []);

    async function fetchPublicProducts() {
        // We fetch all, but in UI we filter/display only what we want.
        // Ideally, RLS would filter columns, but for now we just don't render sensitive info.
        const { data, error } = await supabase
            .from('products')
            .select('id, name, price, description, image, quantity') // Include quantity just to check availability, but won't show number
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching catalog:', error);
        else setProducts(data || []);
    }

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStock = 
            stockFilter === 'all' ? true :
            stockFilter === 'in_stock' ? product.quantity > 0 :
            product.quantity === 0;
            
        return matchesSearch && matchesStock;
    });

    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, { ...product, qty: 1 }];
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const updateQty = (id, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, qty: Math.max(1, item.qty + delta) };
            }
            return item;
        }));
    };

    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

    const handleWhatsAppOrder = () => {
        if (cart.length === 0) return;

        let message = "Hola! Me interesa hacer el siguiente pedido:\n\n";
        cart.forEach(item => {
            message += `• ${item.qty}x ${item.name} ($${item.price})\n`;
        });
        message += `\n*Total Estimado: $${total.toFixed(2)}*`;

        const url = `https://wa.me/5493794145743?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="catalog-view">
            <header className="app-header" style={{ marginBottom: '1rem', padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Catálogo Online</h1>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button
                            className="btn-primary"
                            onClick={() => setIsCartOpen(!isCartOpen)}
                            style={{ position: 'relative' }}
                        >
                            🛒 Carrito ({cart.reduce((a, c) => a + c.qty, 0)})
                        </button>
                        <button
                            onClick={onRequestLogin}
                            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                            Admin Login
                        </button>
                    </div>
                </div>
            </header>

            <div className="main-layout" style={{ gridTemplateColumns: isCartOpen ? '1fr 350px' : '1fr' }}>
                {/* Product Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="search-bar" style={{ display: 'flex', gap: '1rem' }}>
                        <input
                            type="text"
                            placeholder="Buscar en el catálogo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                fontSize: '1.1rem',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                color: 'white'
                            }}
                        />
                        <select
                            value={stockFilter}
                            onChange={(e) => setStockFilter(e.target.value)}
                            style={{
                                padding: '1rem',
                                fontSize: '1.1rem',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                color: 'white',
                                minWidth: '180px',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="all" style={{ color: 'black' }}>Todos los productos</option>
                            <option value="in_stock" style={{ color: 'black' }}>Con stock</option>
                            <option value="out_of_stock" style={{ color: 'black' }}>Sin stock</option>
                        </select>
                        <div className="view-toggle" style={{ border: '1px solid var(--color-border)', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                            <button 
                                className={viewMode === 'grid' ? 'active' : ''} 
                                onClick={() => setViewMode('grid')}
                                title="Vista Cuadrícula"
                                style={{ padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                ⊞
                            </button>
                            <button 
                                className={viewMode === 'list' ? 'active' : ''} 
                                onClick={() => setViewMode('list')}
                                title="Vista Lista"
                                style={{ padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                ☰
                            </button>
                        </div>
                    </div>

                    {filteredProducts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.6)' }}>
                            <p style={{ fontSize: '1.2rem' }}>No encontramos lo que buscas.</p>
                            <small>Prueba con otro término de búsqueda.</small>
                        </div>
                    ) : (
                        <div className={viewMode === 'grid' ? 'product-grid' : 'product-list-view'}>
                            {filteredProducts.map(product => {
                                const isAvailable = product.quantity > 0;
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
                                                {isAvailable ? (
                                                    <span className="stock-badge in-stock">Disponible</span>
                                                ) : (
                                                    <span className="stock-badge low-stock">Agotado</span>
                                                )}
                                            </div>
                                            <p className="product-price">${Number(product.price).toFixed(2)}</p>
                                            {product.description && <p className="product-desc">{product.description}</p>}
                                        </div>

                                        {isAvailable && (
                                            <div className="product-actions" style={{ justifyContent: 'center' }}>
                                                <button className="btn btn-primary" onClick={() => addToCart(product)}>
                                                    Agregar al Carrito
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Floating/Fixed Cart */}
                {isCartOpen && (
                    <aside className="card" style={{ height: 'fit-content', position: 'sticky', top: '1rem' }}>
                        <h2>Tu Pedido</h2>
                        {cart.length === 0 ? (
                            <p style={{ color: 'var(--color-text-secondary)' }}>El carrito está vacío.</p>
                        ) : (
                            <>
                                <ul style={{ listStyle: 'none', marginBottom: '1.5rem' }}>
                                    {cart.map(item => (
                                        <li key={item.id} style={{ padding: '0.8rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span style={{ fontWeight: '500' }}>{item.name}</span>
                                                <span>${(item.price * item.qty).toFixed(2)}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <button className="btn-icon" style={{ width: '24px', height: '24px', fontSize: '1rem' }} onClick={() => updateQty(item.id, -1)}>-</button>
                                                    <span>{item.qty}</span>
                                                    <button className="btn-icon" style={{ width: '24px', height: '24px', fontSize: '1rem' }} onClick={() => updateQty(item.id, 1)}>+</button>
                                                </div>
                                                <button className="btn-danger-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} onClick={() => removeFromCart(item.id)}>x</button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <div style={{ marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'right' }}>
                                    Total: ${total.toFixed(2)}
                                </div>
                                <button
                                    className="btn"
                                    style={{ backgroundColor: '#25D366', color: 'white', width: '100%' }}
                                    onClick={handleWhatsAppOrder}
                                >
                                    📱 Pedir por WhatsApp
                                </button>
                            </>
                        )}
                    </aside>
                )}
            </div>
            <WhatsAppButton />
        </div>
    );
}
