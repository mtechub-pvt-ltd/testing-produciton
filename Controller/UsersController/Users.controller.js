const User = require('../../Model/UserModel/User.model')
const Otp_schema = require('../../Model/OtpModel/Otp.model')
const OTP = Otp_schema.Otp_schema
const { generateOTP } = require('../../Utils/Services/Otp')
const { sendMail } = require('../../Utils/Services/Mail')
const ResponseCode = require('../../Utils/Responses/ResponseCode')
const bcrypt = require('bcrypt');

const createUser = async (req,res)=>{
   
    console.log("create User Call")
   
    const {UserDeviceID,UserCountry,User_Preferences, User_genere,location} = req.body
    // const UserPass1 = bcrypt.hashSync(UserPass, 12)
    User.find({ UserDeviceID: UserDeviceID }, (error, result) => {
      if (error) {
          res.send(error)
      } else {
          // res.send(result)
          if (result === undefined || result.length == 0) {
            console.log('no data')
            const user= new User({
              UserCountry,
              UserDeviceID,
              User_Preferences, 
              User_genere,
              location
          })
          // save User into database
      
      user.save(user)
        .then(data => {
          res.status(200).send({
            data,
            message:"User account created Successfully",
            resCode: ResponseCode.ACCOUNT_CREATED_SUCCESSFULLY
          });
        })
        .catch(err => {
          res.status(500).send({
            message:
              err.message || "Some error occurred while creating the User.",
              resCode: ResponseCode.ERROR_MESSAGE
          });
        });
          }else{
          res.json({message:'This Device_id Already Exist',data:result})
          }
        }
      })
    
 
   
   
}


const UserSignIn= async (req,res)=>{
    console.log("User SignIn Call")
    const {UserDeviceID}= req.body
   //  Validate request
   if (!UserDeviceID) {
    res.status(400).send({ message: "Content can not be empty!" });
    return;
  }
      console.log("User req body data ",req.body)


       User.findOne({
        UserDeviceID:UserDeviceID
      })
        .exec((err, user) => {
          if (err) {
            res.status(500).send({ 
              message: err,
              resCode: ResponseCode.ERROR_MESSAGE
            });
            return;
          }
    
          if (!user) {
            return res.status(404).send({ data:user,message: "User Not found." });
          }else{
          res.json({data:user,message:"Login Successfully"})


          }
          // res.json("here is admin pass ",user)
          // if(bcrypt.compareSync(UserPass, user.UserPass)){
          //   const updateData = {
          //     isLogin:true
          // }
          // const options = {
          //     new: true
          // }
          // User.findByIdAndUpdate(user._id, updateData, options, (error, result) => {
          //     if (error) {
          //         res.json(error.message)
          //     } else {
          //         res.json({data:result,message:"Login Successfully"})
          //     }
          // })
          // }else{
          //   res.status(500).send({
                 
          //     message:"Incorrect Username and pass",
          //     resCode: ResponseCode.INCORECT_EMAIL_PASS
          //   }
          //      );
          // }
          
        });
    }





    const User_ResetPassword= async(req,res)=>{
   
        let Userdata = await User.findOne({UserEmail:req.body.Email})
        
        const generatedOtp = generateOTP();
        console.log('Generated Otp',generateOTP)
        if(Userdata){
                let otpData = new OTP({
                Email:req.body.Email,
                Code: generatedOtp,
                ExpireIn: new Date().getTime() + 300*1000,
                PersonId: Userdata.id
            })
            console.log("user id ",Userdata.id)
             otpData.save(otpData).
             then( data => {
               
                 console.log("OTP data saved successfully")
              })
              .catch(err => {
                res.status(500).send({
                  message:
                    err.message || "Some error occurred while saving the otp"
                });
              });
    
              try {
                await sendMail({
                  to:req.body.Email,
                  OTP:generatedOtp,
                });
                res.status(200).send({
                    message: 'Please check your email for otp verification',
                    OTP:generatedOtp,
                  });
                 
              } catch (error) {
                res.status(500).send({
                    message: 'Unable to Send OTP, Please try again later'
                  });
         
    
              }
    
    
        }else{
            res.status(500).send({
                message: "Some error occurred while saving the otp"
              });
           
    
        }
    
     
    }
    
    
    
    const User_ChangePassword= async (req,res)=>{
      
        const {PersonId,Email,Code,newPass}= req.body
     
        let Otpdata = await OTP.find({PersonId,Email,Code})
        const response={}
         
        if(Otpdata){
           let currentTime = new Date().getTime()
           let diff = Otpdata.expireIn - currentTime
            
           if(diff<0){
            response.message = "Token Expire"
            response.statusText= 'error'
    
           }else{
            response.message = "Otp receive successfully"
            response.statusText= 'success'
    const UserPass1 = bcrypt.hashSync(newPass, 12)
          
    
            User.findOneAndUpdate({id:PersonId}, {
                $set:{UserPass:UserPass1}
            })
            .then(data => {
              if (!data) {
                res.status(404).send({
                  message: `Cannot update User Pass with id=${PersonId}. Maybe User was not found!`
                });
              } else res.send(
                {
                 message1: response.message,
                 status: response.statusText,
                 message: "User pass changes successfully.",
             
             });
            })
            .catch(err => {
              res.status(500).send({
                message: "Error updating User Pass with id=" + PersonId
              });
            });
    
            
           }
          
        }else{
                response.message = "Invalid Otp"
                response.statusText = "error"
            res.status(500).send({
                 message:response.message,
                 status:response.statusText
              });
         
        }
    
    
    }


 const ChangeWithConfirmPass = async (req,res)=>{
        const response={}
        const {id,OldPass,newPass}= req.body
        if (!req.body) {
            res.status(400).send({ message: "Content can not be empty!" });
            return;
          }

          let UserData = await User.find({id,UserPass:OldPass})
          console.log(UserData)
          if(UserData){
          User.findOneAndUpdate({id:id}, {
            $set:{UserPass:newPass}
        })
        .then(data => {
          if (!data) {
            res.status(404).send({
              message: `Cannot update User Pass with id=${UserData.id}. Maybe User was not found!`
            });
          } else res.send(
            {
             message1: response.message,
             status: response.statusText,
             message: "User pass changes successfully.",
         
         });
        })
        .catch(err => {
          res.status(500).send({
            message: "Error updating User Pass with id=" + UserData.id
          });
        });
    }else{
        res.status(500).send({
            message: "Incorrect Old Password Entered"
          });  
    }
        
        
    }
    
    
    
    const ViewUser = async(req,res)=>{
      const {id} = req.body
      User.find({ _id: id }, function (err, foundResult) {
        try {
            res.json({data:foundResult})
        } catch (err) {
            res.json(err)
        }
    }).populate('User_Preferences').populate('User_genere')
    
    }

  const UpdateUser = async(req,res)=>{
     const {id,User_Preferences,User_genere,UserDeviceID,UserCountry} = req.body
     if (!req.body) {
      res.status(400).send({ message: "Content can not be empty!" });
      return;
    }
    
       if (!req.body) {
            res.status(400).send({ message: "Content can not be empty!" });
            return;
          }
    
          User.findByIdAndUpdate(id, {
            UserDeviceID,
            User_Preferences,
            User_genere,
            UserCountry
        }).then(data=>{
      res.status(200).send({
        message:" User updated successfully",

      });
           
    }).catch(err=>{
        res.status(500).send({
            message:
              err.message || "Some error occurred while updating User"
          });
    })


  }


  const DeleteUserAccount=async(req,res)=>{
    const {id} = req.body;
    console.log(id)
     
    if (!req.body.id) {
        res.status(400).send({ message: "User Id required to delete data" });
        return;
      }


    User.findByIdAndRemove(id)
      .then(data => {
        if (!data) {
          res.status(404).send({
            message: `Cannot delete User with id=${id}. Maybe User was not found!`
          });
        } else {
          res.send({
            message: "User deleted successfully!"
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          message: "Could not delete User with id=" + id
        });
      });
  }

  const  ViewAllUsers = async (req,res)=>{
     
    User.find({}, (error, result) => {
      if (error) {
          res.send(error)
      } else {
          res.send(result)
      }
  }).sort({ $natural: -1 }).populate('User_Preferences').populate('User_genere')
}


module.exports = {
    createUser,
    UserSignIn,
    User_ChangePassword,
    User_ResetPassword,
    ChangeWithConfirmPass,
    DeleteUserAccount,
    ViewUser,
    ViewAllUsers,
    UpdateUser
}

