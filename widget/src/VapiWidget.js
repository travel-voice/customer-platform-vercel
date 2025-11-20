import { useEffect, useState } from 'react';
import Vapi from '@vapi-ai/web';
import { postTranscript } from './apiService';

const VapiWidget = ({
  publicKey,
  shouldStartPersona,
  onReady,
  setTranscripts,
  showMeetingWindow,
  currentCharacter,
  settingsLoaded,
  loadingAnimation,
  setLoadingAnimation,
  getCollectedData,
  handleFunctionCall,
  characterName,
}) => {
  const [vapiClient, setVapiClient] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [didSetListeners, setDidSetListeners] = useState(false);
  const [didStartPersona, setDidStartPersona] = useState(false);
  const [vapi_call_id, setVapiCallId] = useState(null);
  const [callStarted, setCallStarted] = useState(false);


  useEffect(() => {
    console.log('Neural Voice Client Initialising');
    console.log(vapiClient);

    if (!publicKey) {
        console.warn('Vapi Public Key not found. Initialization delayed.');
        return;
    }

    const vapi = new Vapi(publicKey);
    setVapiClient(vapi);

    console.log('Neural Voice Client Initialised');
  }, [publicKey]);

  useEffect(() => {
    const getUserID = async () => {
      return 'user-' + Math.random().toString(36).substr(2, 9);
    };

    console.log(shouldStartPersona, didStartPersona)
    if (vapiClient && shouldStartPersona && !didStartPersona) {
      console.log('Initializing Neural Voice client');

      setLoadingAnimation(true);

      console.log(loadingAnimation);

      setDidStartPersona(true);
      const character = currentCharacter;

      if (!character) {
        console.error('No character selected');

        return;
      }
      // console.log(character);
      getUserID().then((userId) => {
        vapiClient.start(character).then((call) => {
          console.log('Call started!');
          console.log(call);
          setVapiCallId(call.id);
        });
      });
    } else if (!shouldStartPersona && didStartPersona) {
      console.log('Stopping persona');
      vapiClient.stop();

      const collectedData = getCollectedData();

      setCallStarted(false);
      postTranscript(vapi_call_id, collectedData, characterName);
      setDidStartPersona(false);
    }
  }, [settingsLoaded, vapiClient, shouldStartPersona, onReady, didStartPersona]);

  useEffect(() => {
    if (vapiClient && onReady && !didSetListeners) {
      vapiClient.on('connect_error', (error) => {});
      vapiClient.on('disconnected', () => {});

      vapiClient.on('message', (msg) => {
        console.log('Message received', msg);
        if(msg.type == 'conversation-update') {
          // 
        }

        if (msg.type == 'speech-update' && callStarted == false) {
          setCallStarted(true);
          setLoadingAnimation(false);

          console.log(loadingAnimation);
        }

        if (msg.type == 'function-call') {
          handleFunctionCall(msg.functionCall.name);
        }

        if (msg.type == 'tool-calls') {
          
          if (msg.toolCalls && msg.toolCalls.length > 0) {
              const functionName = msg.toolCalls[0].function.name;
              handleFunctionCall(functionName);

              console.log('Function name:', functionName);
          } else {
              console.log('No tool calls found in the message');
          }
        }

        if (msg.type !== 'transcript' || msg.transcriptType !== 'final') return;

        if (msg.role) {
          const message = {
            content: msg.transcript,
            type: msg.role == 'assistant' ? 'received' : 'sent',
          };
          setTranscripts((prevTranscripts) => [...prevTranscripts, message]);
        }
      });
      setDidSetListeners(true);
    }
  }, [vapiClient, isReady, didSetListeners]);

  return null;
};

export default VapiWidget;
