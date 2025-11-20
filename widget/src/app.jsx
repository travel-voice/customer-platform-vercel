import React, { useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';

import { fetchSettings } from './apiService';
import ConversationUI from './ConversationUI';

import './styles.css';
import { set } from 'react-hook-form';

const App = () => {
  const [transcripts, setTranscripts] = useState([]);
  const [characterName, setCharacterName] = useState('');
  const [characterImage, setCharacterImage] = useState('');
  const [bookingUrl, setBookingUrl] = useState('');
  const [shouldStartPersona, setShouldStartPersona] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [userCollectionFields, setUserCollectionFields] = useState([]);
  const [publicKey, setPublicKey] = useState('');

  const nvContainerRef = useRef(null);
  const grabButtonRef = useRef(null);

  const loadSettings = () => {
    fetchSettings().then((response) => {
      if (!response) return;

      // Structure: { agents: { ... }, publicKey: "..." }
      const agents = response.agents || response; 
      const key = response.publicKey || '';
      
      setPublicKey(key);

      for (const activation_id in agents) {
        // Iterate through each activation ID in the settings and attach hooks
        const element = document.getElementById(activation_id);
        if (element) {
          // Add the onclick event handler
          element.onclick = () => handleStartConversation(agents[activation_id]);
        } else {
          console.log('No element found with id:', activation_id);
        }
      }

      console.log('Neural Voice Initialised');
      setSettingsLoaded(true);
    });
  };

  // Effect hook to fetch initial settings from the API upon component mount
  useEffect(() => {
    window.getNeuralVoicePopupSettings = loadSettings;
    loadSettings();
  }, []);

  // Function to handle starting a conversation
  const handleStartConversation = (settings) => {
    //These are the settings that are passed from the backend and are used to initialise the persona
    setCharacterName(settings.character);
    setCharacterImage(settings.character_image);
    setBookingUrl(settings.booking_url);
    setCurrentCharacter(settings.voice_id);
    setUserCollectionFields(settings.user_collection_fields || [])

    var popupWindow = document.getElementById('nv-container');
    var background_blur = document.getElementById('blur-background');
    popupWindow.style.display = 'flex';
    background_blur.style.display = 'block';

    setShouldStartPersona(true);
  };

  // Function to handle ending a conversation
  const handleEndConversation = () => {
    var popupWindow = document.getElementById('nv-container');
    var background_blur = document.getElementById('blur-background');
    popupWindow.style.display = 'none';
    background_blur.style.display = 'none';

    //clean up
    setShouldStartPersona(false);
    setTranscripts([]);
    clearTranscriptDisplay();
  };

  // Function to display a meeting booking modal
  const showMeetingWindow = () => {
    const script = document.createElement('script');
    script.src = 'https://static.hsappstatic.net/MeetingsEmbed/ex/MeetingsEmbedCode.js';
    script.type = 'text/javascript';
    setShowMeetingModal(true);
  };

  // Function to hide meeting booking modal
  const hideMeetingWindow = () => {
    setShowMeetingModal(false);
  };

  // Function to simulate typing messages into the UI
  function typeMessage(message, index) {
    const elementId = `message-${index}`;
    let container = document.getElementById(elementId);

    if (!container) {
      container = document.createElement('span');
      container.id = elementId;
      container.className = `message ${message.type}`;
      const messageBox = document.querySelector('.messages');
      messageBox.appendChild(container);
    }

    let i = 0;
    const interval = setInterval(() => {
      if (i < message.content.length) {
        container.textContent += message.content[i];
        i++;
        const messageBox = document.querySelector('.messages');
        messageBox.scrollTop = messageBox.scrollHeight; // Scroll to bottom
      } else {
        clearInterval(interval);
      }
    }, 35); // Adjust typing speed as needed
  }

  // Effect hook to handle auto-scrolling in the transcript container
  useEffect(() => {
    const interval = setInterval(() => {
      const transcriptContainer = document.querySelector('.transcript-display-container');
      if (transcriptContainer) {
        transcriptContainer.scrollTop = transcriptContainer.scrollHeight;
      }
    }, 50);

    // Cleanup
    return () => clearInterval(interval);
  }, []);

  // Function to clear the transcript display
  function clearTranscriptDisplay() {
    const messageBox = document.querySelector('.messages');
    if (messageBox) {
      messageBox.innerHTML = '';
    }
  }

  // Effect hook to make the message container draggable
  useEffect(() => {
    const makeElementDraggable = (element, button) => {
      console.log('hooking up drag element');
      let dx = 0;
      let dy = 0;

      function getElementBoundaries(newTop, newLeft) {
        // Ensure the element stays within the viewport boundaries
        newTop = Math.max(element.offsetHeight / 2, newTop);
        newLeft = Math.max(element.offsetWidth / 2, newLeft);
        newTop = Math.min(window.innerHeight - element.offsetHeight / 2, newTop);
        newLeft = Math.min(window.innerWidth - element.offsetWidth / 2, newLeft);

        return { top: newTop, left: newLeft };
      }

      function elementDrag(e) {
        e.preventDefault();

        const newTop = e.clientY - dx;
        const newLeft = e.clientX - dy;
        const boundaries = getElementBoundaries(newTop, newLeft);

        element.style.top = boundaries.top + 'px';
        element.style.left = boundaries.left + 'px';
      }

      function closeDragElement() {
        document.removeEventListener('mouseup', closeDragElement);
        document.removeEventListener('mousemove', elementDrag);
        button.classList.toggle('grabbing');
        localStorage.setItem('left', element.style.left);
        localStorage.setItem('top', element.style.top);
      }

      button.addEventListener('mousedown', (e) => {
        button.classList.toggle('grabbing');

        dx = e.clientY - element.offsetTop;
        dy = e.clientX - element.offsetLeft;

        document.addEventListener('mouseup', closeDragElement);
        document.addEventListener('mousemove', elementDrag);
      });
    };

    // Ensuring both refs and their current values exist
    if (nvContainerRef.current && grabButtonRef.current) {
      makeElementDraggable(nvContainerRef.current, grabButtonRef.current);
    }
  }, []);

  // Effect hook to handle word replacements
  useEffect(() => {
    if (transcripts.length > 0) {
      const latestTranscript = transcripts[transcripts.length - 1];

      //Word replacement constants for replacing words we've had to jank in the backend. TODO: put replacement json in a file
      const word_replacements = { 'Pen Deryn': 'Penderyn' };
      for (const word in word_replacements) {
        latestTranscript.content = latestTranscript.content.replace(word, word_replacements[word]);
      }

      const index = transcripts.length - 1;
      typeMessage(latestTranscript, index);
    }
  }, [transcripts]);


  const handleFunctionCall = (functionName) => {
    if (functionName == 'meeting') {
      showMeetingWindow();
      console.log("Meeting function called from handlefunctioncall!");
    }
  };

  // Render the main UI components
  return (
    <ConversationUI
      publicKey={publicKey}
      characterName={characterName}
      characterImage={characterImage}
      bookingUrl={bookingUrl}
      showMeetingModal={showMeetingModal}
      handleEndConversation={handleEndConversation}
      hideMeetingWindow={hideMeetingWindow}
      nvContainerRef={nvContainerRef}
      grabButtonRef={grabButtonRef}
      currentCharacter={currentCharacter}
      setTranscripts={setTranscripts}
      shouldStartPersona={shouldStartPersona}
      showMeetingWindow={showMeetingWindow}
      userCollectionFields={userCollectionFields}
      handleFunctionCall={handleFunctionCall}
    />
  );
};

window.initWidget = (containerId) => {
  console.log('Initialising Neural Voice');

  if (!document.getElementById(containerId)) {
    const div = document.createElement('div');
    div.id = containerId;

    document.body.appendChild(div);
  }

  const container = document.getElementById(containerId);
  const root = createRoot(container); // createRoot(container!) if you use TypeScript

  root.render(<App />);
};

document.addEventListener('DOMContentLoaded', function () {
  initWidget('nv_widget');
});

// Fallback: If the script is loaded asynchronously after DOMContentLoaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initWidget('nv_widget');
}
