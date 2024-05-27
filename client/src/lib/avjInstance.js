import Ajv from "ajv";
import AjvFormats from "ajv-formats";
import AjvErrors from "ajv-errors";

//configure AJV
const ajv = new Ajv({
    allErrors: true,
    strict: false,
    $data: true
});

AjvFormats(ajv);
AjvErrors(ajv);

/**
 * Custom validation resolver - passed to react-hook-form
 */
const validateResolver = async (schema, data) => {
    const validate = ajv.compile(schema);
    const isValid = validate(data);
    const {errors} = validate;

    if (isValid ) {
        return {
            values: data,
            errors: {}
        };
    }

    //reduce errors to format form expects
    const errorsFormatted = errors.reduce((prev, current) => ({
        ...prev,
        [current.instancePath.replace("/", "")]: current
    }), {});
    //return expected format
    return {
        values: {},
        errors: errorsFormatted
    };
};

export default validateResolver
