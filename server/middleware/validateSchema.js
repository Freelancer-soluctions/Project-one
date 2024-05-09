export const validateSchema = ( schema ) => {

    return ( req, res, next ) => {

        const { body } = req;
        const { error } = schema.validate( body );
        if ( error ) {

            const { details } = error
            const messages = details?.map( ( erroDetail ) => erroDetail.message );
            return res.status( 422 ).json( { error : messages} );
        }
         next()
    }
}