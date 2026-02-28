# 🔍 The Curio | Experimental Fact-Synthesis Engine

**The Curio** is a hand-coded, high-fidelity search platform designed to bypass conventional search results in favor of obscure, rare, and “rabbit-hole” knowledge. It leverages AI (Google Gemini API) to restructure factual data into thematic clusters, encouraging deeper exploration of niche topics.

🌐 [Live Demo](https://thecurio.netlify.app/)

---

## 🚀 Key Features

- **Multisource Fact Synthesis:** Retrieves rare and verified facts from high-authority and niche archives including NASA, PubMed, Internet Archive, CIA Public Files, Wikipedia, and Reddit.  
- **AI-Driven Categorization:** Dynamically generates thematic "bubbles" (e.g., **Law**, **Medicine**, **History**) for every search term.  
- **Fact-Checking Integrity:** Each information card includes a direct link to the original source, eliminating AI hallucinations.  
- **Personalized User Vault:** Secure login/logout, password recovery, and full management of search history and favorites via Supabase.  
- **Advanced Image Search:** Fetches and contextualizes relevant images for every query.  
- **Seamless UI/UX:** Custom Light/Dark theme toggle with mobile-first, fully responsive design.  

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)  
- **Backend / Database:** Supabase (PostgreSQL, Auth, Storage)  
- **AI Integration:** Google Gemini API  
- **Deployment:** Netlify with optional GitHub integration for CI/CD  

---

## 📂 Project Structure


├── media/ # Hand-drawn character art & custom UI icons
├── auth.js # Supabase authentication & password recovery logic
├── script.js # Core search engine & API integration
├── style.css # Custom translucent UI & responsive layouts
├── theme.js # Dark/Light mode toggle management
└── index.html # Main application entry point


---

## 💡 How It Works

1. User enters a topic or search term.  
2. AI fetches verified facts from multiple sources.  
3. Results are categorized into dynamic thematic bubbles.  
4. Clicking a bubble opens info cards with the fact and **direct source link**.  
5. Users can save, favorite, edit, or delete past searches.  
6. Optional: Visual search returns relevant images.  

> Everything is verified with source links to maintain **full transparency**.

---

## 📝 Developer Note

> "This project was developed entirely on public library infrastructure following a total hardware failure. It represents a commitment to resourceful engineering and the pursuit of accessible, obscure knowledge."

---

## 📄 License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.
