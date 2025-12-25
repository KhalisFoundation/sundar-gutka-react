# sundar-gutka-react

#Install Chocolatey (a package manager for Windows) if it's not installed already. Follow the instructions here: Install Chocolatey.

Install NVM (Node Version Manager) for Windows using Chocolatey:


choco install nvm
Install Node.js LTS and Microsoft OpenJDK 17 using this command:


choco install -y nodejs-lts microsoft-openjdk17
Switch to the required Node version:


nvm install 16
nvm use 16
Install project dependencies:

npm install
Android Development Setup
Install Android Studio
Install Android Studio and download the recommended SDKs and tools (checked by default).

Ensure the following Android SDKs are installed:

Android 14 SDK
Android 34 SDK
Android Build Tools
Android Platform Tools
Configure the ANDROID_HOME environment variable:

Open System Properties → Environment Variables.
Under User Variables, create a new variable ANDROID_HOME and set its value to the SDK path (e.g., C:\Users\<YourName>\AppData\Local\Android\Sdk).
Add the platform-tools directory to your system PATH variable.


C:\Users\<YourName>\AppData\Local\Android\Sdk\platform-tools
Running on Android
Start the application:


npx react-native run-android
Start the Metro bundler:


npx react-native start

#Clone the Repository

-git clone https://github.com/KhalisFoundation/sundar-gutka-react.git

-cd sundar-gutka-react
-Install Dependencies


Make sure you're using the correct Node.js version. You can manage multiple Node versions using NVM (Node Version Manager).

#Install Chocolatey (a package manager for Windows) if it's not installed already. Follow the instructions here: Install Chocolatey.

Install NVM (Node Version Manager) for Windows using Chocolatey:


choco install nvm
Install Node.js LTS and Microsoft OpenJDK 17 using this command:


choco install -y nodejs-lts microsoft-openjdk17
Switch to the required Node version:


nvm install 16
nvm use 16
Install project dependencies:

npm install
Android Development Setup
Install Android Studio
Install Android Studio and download the recommended SDKs and tools (checked by default).

Ensure the following Android SDKs are installed:

Android 14 SDK
Android 34 SDK
Android Build Tools
Android Platform Tools
Configure the ANDROID_HOME environment variable:

Open System Properties → Environment Variables.
Under User Variables, create a new variable ANDROID_HOME and set its value to the SDK path (e.g., C:\Users\<YourName>\AppData\Local\Android\Sdk).
Add the platform-tools directory to your system PATH variable.


C:\Users\<YourName>\AppData\Local\Android\Sdk\platform-tools
Running on Android
Start the application:


#Clone the Repository

-git clone https://github.com/KhalisFoundation/sundar-gutka-react.git

-cd sundar-gutka-react
-Install Dependencies using this command 

npm i or npm install

Make sure you're using the correct Node.js version. You can manage multiple Node versions using NVM (Node Version Manager).