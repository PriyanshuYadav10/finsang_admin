'use client';

export default function DeepLinkTest() {
  const testDeepLink = () => {
    const deepLink = 'finsangmart://accept-invitation?token=inv_ip7xiju55b_1754652501578';
    console.log('Testing deep link:', deepLink);
    
    // Try multiple methods
    window.location.href = deepLink;
    
    // Also try window.open
    setTimeout(() => {
      window.open(deepLink, '_blank');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Deep Link Test</h1>
        <p className="mb-4">Click the button to test if the deep link opens your app:</p>
        <button
          onClick={testDeepLink}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Test Deep Link
        </button>
        <p className="mt-4 text-sm text-gray-600">
          If the app doesn't open, check your app.json configuration and make sure the app is installed.
        </p>
      </div>
    </div>
  );
}
