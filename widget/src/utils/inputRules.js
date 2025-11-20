export const inputsValidation = {
    email_address: {
        rule: { pattern: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/ },
        message: 'Email is invalid!'
    },
    telephone: {
        rule: { pattern: /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/ },
        message: 'Phone number is invalid',
    },
}
