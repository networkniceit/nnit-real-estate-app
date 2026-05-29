import { FaCheckCircle, FaSyncAlt, FaChartLine } from 'react-icons/fa'

function formatCurrency(value) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value))
  } catch {
    return value
  }
}

export default function SellerDashboard({ sellerData, loading, error, onRefresh, onSubscribe, subscribeLoading }) {
  if (!sellerData && !loading && !error) return null

  return (
    <div
      style={{
        background: 'white',
        padding: 25,
        borderRadius: 20,
        marginBottom: 40,
        boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2>Seller Dashboard</h2>
          <p style={{ color: '#6b7280', margin: 0 }}>Manage listings, track orders, and monitor revenue.</p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={onRefresh}
            style={{ background: '#111827', color: 'white', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer' }}
          >
            <FaSyncAlt style={{ marginRight: 6 }} /> Refresh
          </button>
          {onSubscribe && (
            <button
              onClick={onSubscribe}
              disabled={subscribeLoading}
              style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer' }}
            >
              {subscribeLoading ? 'Opening checkout...' : 'Subscribe'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef3c7', color: '#92400e', padding: 18, borderRadius: 16, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: '#374151' }}>Loading seller dashboard...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 15, marginBottom: 20 }}>
            <div style={{ padding: 20, background: '#f9fafb', borderRadius: 16 }}>
              <div style={{ color: '#6b7280', marginBottom: 8 }}>Listings</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{sellerData.metrics?.properties?.length ?? sellerData.properties?.length ?? 0}</div>
            </div>
            <div style={{ padding: 20, background: '#f9fafb', borderRadius: 16 }}>
              <div style={{ color: '#6b7280', marginBottom: 8 }}>Sales</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{sellerData.metrics?.totalSales ?? 0}</div>
            </div>
            <div style={{ padding: 20, background: '#f9fafb', borderRadius: 16 }}>
              <div style={{ color: '#6b7280', marginBottom: 8 }}>Revenue</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{formatCurrency((sellerData.metrics?.totalRevenue ?? 0) / 100)}</div>
            </div>
            <div style={{ padding: 20, background: '#f9fafb', borderRadius: 16 }}>
              <div style={{ color: '#6b7280', marginBottom: 8 }}>Commission</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{formatCurrency((sellerData.metrics?.totalCommission ?? 0) / 100)}</div>
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: 12 }}>Recent Transactions</h3>
            {sellerData.transactions && sellerData.transactions.length > 0 ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {sellerData.transactions.map((tx) => (
                  <div key={tx._id} style={{ padding: 18, background: '#f8fafc', borderRadius: 16 }}>
                    <div style={{ fontWeight: 700 }}>{tx.property?.title || 'Property'}</div>
                    <div style={{ color: '#6b7280', marginTop: 6 }}>{formatCurrency((tx.amount || 0) / 100)} paid by {tx.buyer?.name || tx.buyer?.email || 'Buyer'}</div>
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FaCheckCircle color={tx.status === 'paid' ? '#10b981' : '#f59e0b'} />
                      <span>Status: {tx.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6b7280' }}>No transactions yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
