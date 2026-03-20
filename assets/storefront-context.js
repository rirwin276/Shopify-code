/**
 * STELLA & SAGE - Storefront Context
 * Captures the collection handle to identify private units.
 */
(function() {
  function captureContext() {
    const path = window.location.pathname;
    
    // 1. If we are on a collection page, save the handle
    if (path.includes('/collections/')) {
      const parts = path.split('/');
      // In Shopify URLs, handle is usually after 'collections'
      const handle = parts[parts.indexOf('collections') + 1];

      // List of system collections to ignore
      const ignored = ['all', 'frontpage', 'new-arrivals', 'vendors', 'types'];
      
      if (handle && !ignored.includes(handle)) {
        sessionStorage.setItem('ss_store_handle', handle);
        console.log("[SS-Context] Store handle saved:", handle);
      }
    } 
    
    // 2. Always log the current state for debugging
    const activeHandle = sessionStorage.getItem('ss_store_handle');
    console.log("[SS-Context] Active handle in memory:", activeHandle || "None");
  }

  // Run immediately
  captureContext();
})();