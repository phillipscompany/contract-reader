// Future-proofing: if logo assets are placed under /public/logos, 
// the pill can be replaced with an <img> and name label

export default function TrustedBy() {
  const businesses = [
    "Acme Design", 
    "Northstar Retail", 
    "Pioneer Labs", 
    "Brightline Studio", 
    "Riverstone Ltd"
  ];

  const freelancers = [
    "Maya (Designer)", 
    "Andre (Dev)", 
    "Sofia (Photographer)", 
    "Lewis (Copywriter)", 
    "Priya (Consultant)"
  ];

  const students = [
    "Uni of London", 
    "NYU", 
    "U of Toronto", 
    "UCLA", 
    "LSE"
  ];

  // Merge all arrays and create a longer list for smooth scrolling
  const allItems = [
    ...businesses,
    ...freelancers, 
    ...students
  ];

  // Create duplicate for seamless scrolling
  const duplicatedItems = [...allItems, ...allItems];

  // Define different styles for variety (only for businesses and students)
  const getItemStyle = (item: string, index: number) => {
    // Check if it's a freelancer (contains parentheses)
    const isFreelancer = item.includes('(');
    
    if (isFreelancer) {
      // Same style for all freelancers
      return { fontFamily: 'Arial, sans-serif', color: '#6b7280', fontWeight: '500' };
    }
    
    // Different styles for businesses and students
    const styles = [
      { fontFamily: 'Georgia, serif', color: '#1e40af', fontWeight: '600' }, // Blue, serif
      { fontFamily: 'Arial, sans-serif', color: '#dc2626', fontWeight: '700' }, // Red, bold
      { fontFamily: 'Helvetica, sans-serif', color: '#059669', fontWeight: '500' }, // Green, medium
      { fontFamily: 'Times, serif', color: '#7c3aed', fontWeight: '600' }, // Purple, serif
      { fontFamily: 'Verdana, sans-serif', color: '#ea580c', fontWeight: '500' }, // Orange, medium
      { fontFamily: 'Courier, monospace', color: '#0891b2', fontWeight: '600' }, // Cyan, monospace
      { fontFamily: 'Georgia, serif', color: '#be123c', fontWeight: '700' }, // Pink, bold serif
      { fontFamily: 'Arial, sans-serif', color: '#65a30d', fontWeight: '500' }, // Lime, medium
      { fontFamily: 'Helvetica, sans-serif', color: '#9333ea', fontWeight: '600' }, // Violet, medium
      { fontFamily: 'Times, serif', color: '#c2410c', fontWeight: '700' }, // Amber, bold serif
    ];
    return styles[index % styles.length];
  };

  return (
    <section className="trustedby">
      <div className="container">
        <h2 className="trustedby__title">Trusted by</h2>
        <div className="trustedby__track" aria-label="Trusted by carousel">
          <div className="trustedby__row">
            {duplicatedItems.map((item, index) => {
              const style = getItemStyle(item, index);
              return (
                <div 
                  key={index} 
                  className="trustedby__pill"
                  style={style}
                >
                  {item}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
