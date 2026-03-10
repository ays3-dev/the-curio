# 🔍 The Curio | Experimental Fact-Synthesis Engine

**The Curio** is a hand-coded, high-fidelity search platform designed to bypass conventional search results in favor of obscure, rare, and “rabbit-hole” knowledge. It leverages AI (Google Gemini API) to restructure factual data into thematic clusters, encouraging deeper exploration of niche topics.

<p align="center">
  <img src="https://kaplumbagadeden.neocities.org/media/thecuriolight.png" alt="Screenshot of The Curio" width="600">
</p>
 <p align="center">
🌐 [**Live Demo**](https://thecurio.netlify.app/)
</p>

---

## **🚀 Key Features**

- **Full-Stack Node.js Architecture:** Migrated to a dedicated Express.js backend for secure API handling and environment variable protection.
- **Multisource Fact Synthesis:** Retrieves rare and verified facts from high-authority archives including NASA, PubMed, Internet Archive, CIA Public Files, Wikipedia, and Reddit.
- **AI-Driven Categorization:** Dynamically generates thematic "bubbles" (e.g., **Law**, **Medicine**, **History**) for every search term.
- **Fact-Checking Integrity:** Each information card includes a direct link to the original source, eliminating AI hallucinations.
- **Personalized User Vault:** Secure login, profile management (custom avatars via Supabase Storage), and persistent search history.
- **Seamless UI/UX:** Custom Light/Dark theme toggle with mobile-first, fully responsive design.

---

## **🛠️ Tech Stack**

* **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
* **Backend:** **Node.js**, **Express.js**
* **Database / Auth:** Supabase (**PostgreSQL**, Row Level Security, Cloud Storage)
* **AI Integration:** Google Gemini API
* **Security:** Dotenv (Environment Variable Management)
* **Deployment:** Netlify 

---

## **⚙️ Getting Started**

1. Clone the Repository
```
git clone https://github.com/yourusername/the-curio.git

cd the-curio
```

2. Install Dependencies
```
npm install
```

3. Create a .env file in the root directory to store server-side secrets:
```
GEMINI_API_KEY=your_google_gemini_key
PORT=3000
```
> Note: Supabase URL and Anon Key are managed within the frontend public/js/auth.js to leverage PostgreSQL Row Level Security (RLS).

4. Run the Server
``` 
npm start
```

> The application will be available at http://localhost:3000

---

## **📂 Project Structure**

├── public/                 # Client-side assets (The "Face")

│   ├── media/              # Character art & UI icons

│   ├── auth.js             # Supabase Auth & PFP update logic

│   ├── script.js           # Frontend engine & UI management

│   ├── style.css           # Glassmorphism & responsive layouts

│   └── index.html          # Main entry point

├── server/                 # Server-side logic (The "Brain")

│   ├── ai.js               # Gemini API integration

│   └── fetch.js            # External data synthesis logic

├── .env                    # Secure API keys (ignored by Git)

├── server.js               # Express server entry point

└── package.json            # Node.js dependencies & scripts

---

## 💡 How It Works

1. User enters a topic or search term.  
2. Frontend sends the query to the Node.js server.  
3. Server fetches verified facts via AI and external sources.  
4. Results are organized into dynamic thematic bubbles. 
5. Clicking a bubble opens info cards with the fact and direct source link.
6. Users can save, favorite, edit, or delete past searches.  
7. Optional: Visual search returns relevant images.  

> Everything is verified with source links to maintain **full transparency**.

---

## 📝 Developer Note

> "This project was developed entirely on public library infrastructure following a total hardware failure. It represents a commitment to resourceful engineering and the pursuit of accessible, obscure knowledge."

---

## 📄 License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

