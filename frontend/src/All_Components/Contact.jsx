import { Container, Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import React, { useState } from "react";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add your form submission logic here
    console.log("Form submitted:", formData);
    alert("Bedankt voor je bericht! We nemen zo snel mogelijk contact op.");
    setFormData({ name: "", email: "", message: "" });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-serif font-bold text-indigo-900 mb-2">Neem Contact Op</h1>
          <p className="text-lg text-purple-800">We horen graag van je</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="md:flex">
            {/* Contact Form */}
            <div className="md:w-1/2 p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Naam
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    E-mailadres
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    Bericht
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows="4"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  ></textarea>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200 flex items-center justify-center"
                  >
                    Verstuur <Container className="ml-2" />
                  </button>
                </div>
              </form>
            </div>

            {/* Contact Info */}
            <div className="md:w-1/2 bg-gradient-to-br from-purple-100 to-indigo-100 p-8 flex flex-col justify-center">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-serif font-semibold text-indigo-900 mb-2">Directe contactgegevens</h2>
                  <div className="flex items-start">
                    <Container className="text-indigo-600 mt-1 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">E-mail ons op</p>
                      <a 
                        href="mailto:info@spiritueelchatten.com" 
                        className="text-indigo-700 hover:text-indigo-900 font-medium"
                      >
                        info@spiritueelchatten.com
                      </a>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-serif font-semibold text-indigo-900 mb-3">Volg ons</h2>
                  <div className="flex space-x-4">
                    <a href="#" className="text-purple-600 hover:text-purple-800">
                      <Facebook size={20} />
                    </a>
                    <a href="#" className="text-purple-600 hover:text-purple-800">
                      <Instagram size={20} />
                    </a>
                    <a href="#" className="text-purple-600 hover:text-purple-800">
                      <Twitter size={20} />
                    </a>
                    <a href="#" className="text-purple-600 hover:text-purple-800">
                      <Linkedin size={20} />
                    </a>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;