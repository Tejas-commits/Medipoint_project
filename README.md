## ⚕️ MediPoint - Health and Wellness Engagement Application

This project is a comprehensive, user-friendly, and privacy-focused mobile application designed to simplify daily healthcare management by integrating previously fragmented health tools into a single, cohesive platform.

-----

## 🌟 Features

The application addresses the common user challenge of juggling multiple health apps (for medicine tracking, cycle tracking, e-pharmacy, etc.) by unifying four core functions.

### **Core Modules**

1.  **Medicine Management:**
      * Ensures medication adherence via reminders and visual indicators.
      * Tracks local adherence history and progress.
2.  **Healthcare Provider Locator:**
      * Provides easy access to doctors, hospitals, and pharmacies.
      * Integrates map-based search, filtering, and contact details.
      * Includes directions via Google Maps integration.
3.  **Medicine Store:**
      * Allows browsing medicines with appropriate description.
      * Adding medicines to a cart and selecting the quantity of medicines.
4.  **Menstrual Cycle Tracker:**
      * Offers a calendar view for logging periods, symptoms, and notes.
      * Provides predictive insights for women’s health.

### **Key Differentiating Principles**

  * **Privacy-First & Local Storage:** All sensitive health data (logs, reminders, history) is stored locally on the device using **AsyncStorage**, minimizing reliance on cloud storage.
  * **Offline Capability:** Core features, including reminders, adherence history, and the menstrual calendar, function fully without internet connectivity.
  * **Simple UI:** Designed using **Material Design principles** for clarity, accessibility, and ease of use, making it suitable for older adults and low-tech users.

-----

## 🛠️ Technology Stack

The application was built using **React Native** for cross-platform compatibility and a local-first architecture.

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend/Platform** | **React Native** (with Expo) | Core development framework for cross-platform mobility. |
| **User Interface** | **React native Paper** (Material Design) | UI/UX framework ensuring a clean and accessible interface. |
| **Local Storage** | **AsyncStorage** | Used for secure, local, offline data storage of all user health logs. |
| **Reminders** | **Expo Notifications** | Implemented the medicine reminder engine and adherence tracking. |
| **API Integration** | **Google Maps / Places API** | Used for the Healthcare Provider Locator module. |
| **Languages** | **TypeScript/JavaScript** | Development languages. |

-----

## 🚀 Installation and Setup

### **Prerequisites**

  * Node.js (LTS version)
  * Expo CLI (`npm install -g expo-cli`)
  * Developer System (Windows/macOS/Linux) with at least 8 GB RAM.

### **Steps**

1.  **Clone the Repository:**
    ```bash
    git clone [Link to Repository - Not provided in source]
    cd HealthWellnessApp
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Configure APIs:**
      * Ensure you have configured your **Google Maps / Places API key** for the provider locator module. *(This configuration detail is assumed, but API usage is confirmed.)*
4.  **Start the Project:**
    ```bash
    expo start
    ```
5.  **Run on Device/Emulator:**
      * Scan the QR code displayed in the terminal using the **Expo Go app** on your Android or iOS device.

-----

## 💡 Future Scope

The project is designed to be scalable for several high-impact future enhancements:

  * **Cloud Backup & Multi-Device Sync:** Allowing secure backup and cross-device data access.
  * **Teleconsultation & Appointment Booking:** Integrating video/audio consults and e-prescriptions.
  * **AI-Powered Insights:** Implementing machine learning for smarter predictions and personalized health tips.
  * **Payment Gateway Integration:** Enabling secure in-app payments for services.

-----

*This README is based on the CEP Project Report submitted by Rasika Kharche, Makarand Kaware, Tejas Kolekar, and Vedangi Gholap.* 


### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Comprehensive error handling
- Detailed logging for debugging
