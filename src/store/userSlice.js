import { createSlice } from "@reduxjs/toolkit";


const initialState = {
    name: "vicky"
};

export const userSlice = createSlice({
    name: "user",
    initialState,
    reducers:{
        addUser: (state,action) =>{
            console.log(action.payload);
           return action.payload
        }
    }
})


export default userSlice.reducer

export const { addUser } = userSlice.actions