export default function Reviews() {
  const testimonials = [
    {
      text: "Great for a free tool! I was able to understand my lease agreement in minutes instead of spending hours trying to decode legal jargon.",
      name: "Sarah",
      location: "London",
      initials: "S"
    },
    {
      text: "Super easy to use. Just upload your document and get a clear breakdown of what you're actually signing. Saved me from a bad contract!",
      name: "James", 
      location: "New York",
      initials: "J"
    },
    {
      text: "Much easier than reading through 15 pages of stuff I don't understand myself. The AI highlighted all the important risks I needed to know about.",
      name: "George",
      location: "Newcastle", 
      initials: "G"
    }
  ];

  return (
    <section className="reviews">
      <div className="container">
        <div className="reviews__header">
          <h2 className="reviews__title">What Our Users Say</h2>
          <p className="reviews__subtitle">
            Trusted by renters, freelancers, and small business owners.
          </p>
        </div>
        
        <div className="reviews__grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="review-card">
              <div className="review-card__avatar">
                {testimonial.initials}
              </div>
              <div className="review-card__content">
                <p className="review-card__text">
                  "{testimonial.text}"
                </p>
                <div className="review-card__author">
                  <span className="review-card__name">{testimonial.name}</span>
                  <span className="review-card__location">{testimonial.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
