/**
 * Demo mobile callback component - DEPRECATED
 *
 * This component has been replaced by the real LinkedInMobileCallback component
 * from the react-linkedin-login-oauth2 library. This file is kept for reference
 * but is no longer used in the routing.
 *
 * See main.tsx - the route now uses the real LinkedInMobileCallback component.
 */

export function LinkedInMobileCallbackDemo() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'Arial, sans-serif',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '40px 20px',
          textAlign: 'center',
          backgroundColor: '#fff3cd',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          maxWidth: '400px',
          border: '1px solid #ffeaa7',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
        <div
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#856404',
            marginBottom: '10px',
          }}
        >
          Demo Component - DEPRECATED
        </div>
        <div style={{ fontSize: '14px', color: '#856404', lineHeight: '1.5' }}>
          This demo component has been replaced by the real
          LinkedInMobileCallback component from the library.
        </div>
        <div style={{ fontSize: '12px', color: '#6f5f00', margin: '15px 0' }}>
          The route /linkedin-mobile now uses:
          <br />
          <code style={{ backgroundColor: '#f8f9fa', padding: '2px 4px' }}>
            {'<LinkedInMobileCallback debug={true} />'}
          </code>
          <br />
          <br />
          This provides real OAuth2 callback handling with:
          <br />• Parameter parsing and validation
          <br />• State-based CSRF protection
          <br />• localStorage result storage
          <br />• Automatic popup closing
        </div>
        <button
          onClick={() => (window.location.href = '/')}
          style={{
            marginTop: '20px',
            padding: '8px 16px',
            backgroundColor: '#0077B5',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Return to Demo
        </button>
      </div>
    </div>
  );
}
