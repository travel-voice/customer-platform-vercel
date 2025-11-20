import React, { useEffect, useState } from 'react';
import VapiWidget from './VapiWidget';
import { useForm } from 'react-hook-form';
import { Button, Checkbox, FormControlLabel, Link, TextField } from '@mui/material';

import { prettyTextWithUnderscores } from './utils/textUtils';
import { inputsValidation } from './utils/inputRules';
import PropTypes from 'prop-types';

const ConversationUI = ({
  publicKey,
  characterName,
  characterImage,
  bookingUrl,
  showMeetingModal,
  handleEndConversation,
  hideMeetingWindow,
  nvContainerRef,
  grabButtonRef,
  currentCharacter,
  setTranscripts,
  shouldStartPersona,
  showMeetingWindow,
  userCollectionFields,
  handleFunctionCall,
}) => {
  const [loadingAnimation, setLoadingAnimation] = useState(false);
  const [isDataSent, setIsDataSent] = useState(false);
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);
  const [isRequiredFieldsExists, setIsRequiredFieldsExists] = useState(false);

  const {
    register,
    getValues,
    watch,
    formState: { errors, isValid },
  } = useForm({
    mode: 'onChange',
  });

  React.useEffect(() => {
    const subscription = watch((value) => {
      const isEmailEntered = !!value['email_address'];
      const isTelephoneEntered = !!value['telephone'];

      setIsRequiredFieldsExists(isEmailEntered || isTelephoneEntered);
    });

    return () => subscription.unsubscribe();
  }, [watch]);

  const getCollectedData = () => {
    const newData = {};

    const data = getValues();

    Object.entries(data).forEach(([key, value]) => {
      if (!!value) {
        newData[key] = value;
      }
    });

    return newData;
  };

  if (process.env.NODE_ENV === 'test') {
    window.__getCollectedData = getCollectedData;
  }

  const handleSubmit = () => {
    setIsDataSent(true);
  };

  useEffect(() => {
    if (!isDataSent) return;

    setTimeout(() => {
      setIsDataSent(false);
    }, 5000);
  }, [isDataSent]);

  //Delay loading alert so it doesn't appear at the same time as the popup
  //Timer here delays the start of the animation - length of animation is in styles.css

  return (
    <div id="nv_widget">
      <div id="blur-background"></div>
      <div id="popup-container">
        <div id="nv-container" ref={nvContainerRef}>
          <img className="background-image" src={characterImage} alt={characterName} />
          <button className="close-button" onClick={handleEndConversation}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 768 768">
              <path
                d="M768 77.315l-306.685 306.685 306.685 306.685-77.315 77.315-306.685-306.685-306.685 306.685-77.315-77.315 306.685-306.685-306.685-306.685 77.315-77.315 306.685 306.685 306.685-306.685z"
                fill="black"
              ></path>
            </svg>
          </button>
          <h2 className="title">
            You are now chatting with AI <span className="character-name">{characterName}</span>
          </h2>
          <p className="description">Please make sure you enable your microphone</p>
          <div className="message-box">
            <div className="messages">
              {loadingAnimation && (
                <div className="loader-box">
                  <div className="loader-text">Loading</div>
                  <div className="loader" />
                </div>
              )}
            </div>
          </div>

          {!!userCollectionFields.length && (
            <div className="inputs-container">
              <p className="inputs-text">Please confirm your details below</p>
              <div className="inputs-box">
                <div style={{ position: 'relative' }}>
                  <div className="inputs" style={{ opacity: isDataSent ? 0 : 1 }}>
                    {userCollectionFields.map((field) => (
                      <div key={field} className="input-wrapper">
                        <TextField
                          className="input"
                          size="small"
                          label={prettyTextWithUnderscores(field)}
                          variant="outlined"
                          {...register(field, inputsValidation[field]?.rule || {})}
                        />
                        {errors?.[field]?.type === 'pattern' && inputsValidation[field]?.message && (
                          <p className="error-message">{inputsValidation[field].message}</p>
                        )}
                      </div>
                    ))}
                    <div className="controls-row">
                      <div className="input-wrapper">
                        <FormControlLabel
                          control={
                            <Checkbox
                              onChange={(event) => setIsCheckboxChecked(event.target.checked)}
                              value={isCheckboxChecked}
                            />
                          }
                          label={
                            <p className="checkbox-text">
                              By submitting these details you’re agreeing to our{' '}
                              <Link
                                href="https://drive.google.com/file/d/1genTjd2XZ7ZHyAdQbeBRFk1Y1l94dgzF/view"
                                target="_blank"
                              >
                                Privacy Policy
                              </Link>
                              .
                            </p>
                          }
                        />
                      </div>
                    </div>
                    <div className="controls-row">
                      <div className="input-wrapper">
                        {!isRequiredFieldsExists && <p className="error-message">Email or Telephone is required.</p>}
                      </div>
                      <div className="input-wrapper">
                        <Button
                          variant="outlined"
                          onClick={handleSubmit}
                          disabled={!isValid || !isCheckboxChecked || !isRequiredFieldsExists}
                        >
                          Submit
                        </Button>
                      </div>
                    </div>
                  </div>
                  {isDataSent && <p className="message-text">Your data has been sent!</p>}
                </div>
              </div>
            </div>
          )}

          <div id="grab" className="grab" ref={grabButtonRef}>
            <svg width="44" height="24" viewBox="0 0 44 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="4" cy="8" r="1" transform="rotate(-180 4 8)" stroke="#515354" strokeWidth="2" />
              <circle cx="4" cy="16" r="1" transform="rotate(-180 4 16)" stroke="#515354" strokeWidth="2" />
              <circle cx="12" cy="8" r="1" transform="rotate(-180 12 8)" stroke="#515354" strokeWidth="2" />
              <circle cx="12" cy="16" r="1" transform="rotate(-180 12 16)" stroke="#515354" strokeWidth="2" />
              <circle cx="20" cy="8" r="1" transform="rotate(-180 20 8)" stroke="#515354" strokeWidth="2" />
              <circle cx="20" cy="16" r="1" transform="rotate(-180 20 16)" stroke="#515354" strokeWidth="2" />
              <circle cx="28" cy="8" r="1" transform="rotate(-180 28 8)" stroke="#515354" strokeWidth="2" />
              <circle cx="28" cy="16" r="1" transform="rotate(-180 28 16)" stroke="#515354" strokeWidth="2" />
              <circle cx="36" cy="8" r="1" transform="rotate(-180 36 8)" stroke="#515354" strokeWidth="2" />
              <circle cx="36" cy="16" r="1" transform="rotate(-180 36 16)" stroke="#515354" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>

      {showMeetingModal && (
        <div
          id="meeting-modal"
          data-testid="meeting-modal"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 999999999999,
            height:'100%',
            width:'100%',
            maxHeight:'800px',
            maxWidth:'800px',
          }}
        >
          <iframe
            src={bookingUrl}
            title="booking_frame"
            allowFullScreen
            style={{ width: '100%', height: '100%', maxHeight:'800px', maxWidth:'800px' , border: 'none' }}
          ></iframe>
          <button
            onClick={() => hideMeetingWindow()}
            style={{
              position: 'absolute',
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'black',
            }}
          >
            &times;
          </button>
        </div>
      )}

      <VapiWidget
        publicKey={publicKey}
        onReady={() => console.log('Persona ready!')}
        setTranscripts={setTranscripts}
        shouldStartPersona={shouldStartPersona}
        showMeetingWindow={showMeetingWindow}
        currentCharacter={currentCharacter}
        loadingAnimation={loadingAnimation}
        setLoadingAnimation={setLoadingAnimation}
        getCollectedData={getCollectedData}
        handleFunctionCall={handleFunctionCall}
        characterName={characterName}
      />
    </div>
  );
};

ConversationUI.propTypes = {
  publicKey: PropTypes.string,
  characterName: PropTypes.string.isRequired,
  characterImage: PropTypes.string.isRequired,
  bookingUrl: PropTypes.string,
  showMeetingModal: PropTypes.bool.isRequired,
  handleEndConversation: PropTypes.func,
  hideMeetingWindow: PropTypes.func,
  nvContainerRef: PropTypes.object,
  grabButtonRef: PropTypes.object,
  currentCharacter: PropTypes.object,
  setTranscripts: PropTypes.func.isRequired,
  shouldStartPersona: PropTypes.bool.isRequired,
  showMeetingWindow: PropTypes.bool.isRequired,
  userCollectionFields: PropTypes.array.isRequired,
};

export default ConversationUI;
