import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function Dashboard({ products, sales }) {
    const [showLowStockModal, setShowLowStockModal] = useState(false);
    const stats = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const salesToday = sales.filter(s => {
            const saleDate = new Date(s.date);
            return saleDate >= today;
        });

        const revenueToday = salesToday.reduce((acc, s) => acc + s.total, 0);
        const costToday = salesToday.reduce((acc, s) => acc + (s.total_cost || s.totalCost || 0), 0);
        const profitToday = revenueToday - costToday;

        const lowStockProducts = products.filter(p => {
            const min = p.min_stock || p.minStock || 5;
            return p.quantity < min;
        });
        const lowStockCount = lowStockProducts.length;

        // Chart Data (Last 7 days)
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - (6 - i));
            return d;
        });

        const chartData = last7Days.map(date => {
            const daySales = sales.filter(s => {
                const sDate = new Date(s.date);
                sDate.setHours(0, 0, 0, 0);
                return sDate.getTime() === date.getTime();
            });

            const total = daySales.reduce((acc, s) => acc + s.total, 0);
            return {
                name: date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
                ventas: total
            };
        });

        return {
            revenueToday,
            profitToday,
            lowStockCount,
            lowStockProducts,
            totalProducts: products.length,
            chartData
        };
    }, [products, sales]);

    return (
        <div className="dashboard-container">
            <h2>Panel de Control</h2>

            <div className="stats-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Ventas Hoy</h3>
                    <p style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>${stats.revenueToday.toFixed(2)}</p>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--color-success)' }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Ganancia Hoy</h3>
                    <p style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>${stats.profitToday.toFixed(2)}</p>
                </div>
                <div 
                    className="card" 
                    style={{ borderLeft: '4px solid var(--color-danger)', cursor: stats.lowStockCount > 0 ? 'pointer' : 'default', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)' } }}
                    onClick={() => stats.lowStockCount > 0 && setShowLowStockModal(true)}
                    title={stats.lowStockCount > 0 ? "Haz clic para ver los productos" : ""}
                >
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Stock Bajo</h3>
                    <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: stats.lowStockCount > 0 ? 'var(--color-danger)' : 'inherit' }}>
                        {stats.lowStockCount}
                    </p>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--color-text-secondary)' }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Total Productos</h3>
                    <p style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{stats.totalProducts}</p>
                </div>
            </div>

            <div className="card" style={{ height: '400px' }}>
                <h3 style={{ marginBottom: '1rem' }}>Ventas últimos 7 días</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="name" stroke="var(--color-text-secondary)" />
                        <YAxis stroke="var(--color-text-secondary)" />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: '#333' }}
                            itemStyle={{ color: 'var(--color-text-primary)' }}
                        />
                        <Legend />
                        <Bar dataKey="ventas" name="Ventas ($)" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {showLowStockModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ color: 'var(--color-danger)', margin: 0 }}>Productos con Stock Bajo</h3>
                            <button className="btn-icon" onClick={() => setShowLowStockModal(false)} style={{ border: 'none' }}>×</button>
                        </div>
                        <div style={{ overflowY: 'auto' }}>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {stats.lowStockProducts.map(p => (
                                    <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <span>{p.name}</span>
                                        <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>
                                            {p.quantity} unid. (Mín: {p.min_stock || p.minStock || 5})
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
