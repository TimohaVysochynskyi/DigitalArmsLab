/* Такі файли я створюю для фіч форм. Коли потрібно прописати валідацію. Валідацію я прописую на yup */
/* Нижче приклад правильно прописаної валідації (вставлено сюди з фічі auth, чисто для прикладу) */

import * as yup from "yup";

export type LoginFormValues = {
    email: string;
    password: string;
};

export type RegisterFormValues = {
    name: string;
    email: string;
    password: string;
    passwordConfirm: string;
    acceptedTerms: boolean;
};

export const loginFormInitialValues: LoginFormValues = {
    email: "",
    password: "",
};

export const registerFormInitialValues: RegisterFormValues = {
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
    acceptedTerms: false,
};

const passwordSchema = yup
    .string()
    .trim()
    .required("Введіть пароль")
    .min(8, "Пароль має містити щонайменше 8 символів")
    .matches(/[A-Z]/, "Додайте хоча б одну велику літеру")
    .matches(/[a-z]/, "Додайте хоча б одну малу літеру")
    .matches(/[0-9]/, "Додайте хоча б одну цифру")
    .matches(/[^A-Za-z0-9]/, "Додайте хоча б один спеціальний символ");

export const loginValidationSchema: yup.ObjectSchema<LoginFormValues> = yup
    .object({
        email: yup
            .string()
            .trim()
            .email("Некоректний формат email")
            .required("Введіть email"),
        password: passwordSchema,
    })
    .required();

export const registerValidationSchema: yup.ObjectSchema<RegisterFormValues> = yup
    .object({
        name: yup
            .string()
            .trim()
            .required("Введіть ім'я")
            .min(2, "Ім'я має містити щонайменше 2 символи")
            .max(50, "Ім'я не має перевищувати 50 символів"),
        email: yup
            .string()
            .trim()
            .email("Некоректний формат email")
            .required("Введіть email"),
        password: passwordSchema,
        passwordConfirm: yup
            .string()
            .required("Підтвердіть пароль")
            .oneOf([yup.ref("password")], "Паролі не співпадають"),
        acceptedTerms: yup
            .boolean()
            .oneOf([true], "Потрібно погодитись з умовами")
            .required(),
    })
    .required();
