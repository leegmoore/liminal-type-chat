import * as jwt from 'jsonwebtoken';

// Check SignOptions type
function checkJwtTypes() {
  const options: jwt.SignOptions = {
    expiresIn: '30m' // Should be string or number
  };
  
  // Check verify return type
  const verified = jwt.verify('token', 'secret') as jwt.JwtPayload;
  console.log(options, verified);
}

export default checkJwtTypes;