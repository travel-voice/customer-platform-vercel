export const prettyTextWithUnderscores = (text) => (
    text ? text.split('_').map((word) => word ? `${word[0].toUpperCase()}${word.slice(1, word.length)}` : '').join(' ') : ''
);