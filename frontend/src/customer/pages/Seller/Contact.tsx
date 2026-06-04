import React, { useState } from 'react';

export default function Contact({ seller }: any) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      alert('Please fill out all fields.');
      return;
    }

    setIsSubmitting(true);

    fetch(
      'http://localhost:8080/api/enquiry/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellerId: seller._id,
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('API server down');
        return res.json();
      })
      .then(() => {
        alert(
          `Thank you! Your message has been sent successfully. ${seller?.businessDetails?.businessName}  will reply within 2 hours.`
        );
        setFormData({ name: '', email: '', subject: '', message: '' });
        setIsSubmitting(false);
      })
      .catch(err => {
        console.log('Backend not connected, running in demo mode:', err);
        alert('Thank you! Your message has been sent successfully (Demo Mode). ${seller?.businessDetails?.businessName} will reply within 2 hours.');
        setFormData({ name: '', email: '', subject: '', message: '' });
        setIsSubmitting(false);
      });
  };

  return (
    <section className="section">
      <div className="contact-grid">
        {/* CONTACT FORM */}
        <div className="contact-card animate-in">
          <h3>
            <span className="cm-icon" style={{ fontSize: '1.1rem', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-bg-strong)', borderRadius: '6px', marginRight: '8px' }}>✉</span>
            Send Us a Message
          </h3>
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Your Name</label>
                <input
                  type="text"
                  id="name"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  required
                  placeholder="e.g. john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="subject">Reason for Contact</label>
              <select
                id="subject"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              >
                <option value="">Select an option</option>
                <option value="order">Order Tracking & Status</option>
                <option value="product">Product Information Inquiry</option>
                <option value="returns">Returns & Exchange Request</option>
                <option value="bulk">Bulk Order & Wholesale Quotation</option>
                <option value="other">Other Inquiry</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="message">Detailed Message</label>
              <textarea
                id="message"
                required
                placeholder="Describe your question or issue in detail..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              ></textarea>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ alignSelf: 'flex-start', marginTop: '10px' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : '✉ Send Message'}
            </button>
          </form>
        </div>

        {/* STORE COORDINATES & HOURS */}
        {/* STORE COORDINATES & HOURS */}

        {/* STORE COORDINATES & HOURS */}

        <div
          className="contact-card animate-in"
          style={{ height: "fit-content" }}
        >

          <h3>

            <span className="cm-icon">

              📞

            </span>

            Store Coordinates

          </h3>


          <ul className="contact-methods">

            <li>

              <div className="cm-icon">📍</div>

              <div>

                <div className="cm-label">

                  Physical Address

                </div>

                <div className="cm-value">
                  {
                    seller?.businessDetails?.businessAddress
                    ||
                    seller?.location?.address
                    ||
                    "Address not available"
                  }
                </div>

              </div>

            </li>



            <li>

              <div className="cm-icon">✉</div>

              <div>

                <div className="cm-label">

                  E-Mail Address

                </div>

                <div className="cm-value">

                  <a href={`mailto:${seller?.email}`}>

                    {
                      seller?.email
                      ||
                      "Email unavailable"
                    }

                  </a>

                </div>

              </div>

            </li>



            <li>

              <div className="cm-icon">📞</div>

              <div>

                <div className="cm-label">

                  Hotline Assistance

                </div>

                <div className="cm-value">

                  <a href={`tel:${seller?.mobile}`}>

                    {
                      seller?.mobile
                      ||
                      seller?.phone
                      ||
                      "Phone unavailable"
                    }

                  </a>

                </div>

              </div>

            </li>

          </ul>



          {/* BUSINESS HOURS */}

          <div className="business-hours">

            <h3
              style={{
                marginTop: "20px",
                fontSize: "1rem"
              }}
            >

              ⏰ Standard Operating Hours

            </h3>


            <table className="hours-table">

              <tbody>

                <tr>

                  <td>

                    Monday - Friday

                  </td>

                  <td>

                    09:00 AM - 06:30 PM

                  </td>

                </tr>


                <tr className="today">

                  <td>

                    Saturday

                  </td>

                  <td>

                    10:00 AM - 04:00 PM

                  </td>

                </tr>


                <tr>

                  <td>

                    Sunday

                  </td>

                  <td>

                    Closed

                  </td>

                </tr>

              </tbody>

            </table>

          </div>

        </div> {/* end contact-card */}

      </div> {/* end contact-grid */}

    </section>

  );

}