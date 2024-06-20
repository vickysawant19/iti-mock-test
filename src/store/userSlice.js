import { createSlice } from "@reduxjs/toolkit";


const initialState = null;

export const userSlice = createSlice({
    name: "user",
    initialState,
    reducers:{
        addUser: (state,action) =>{
           return action.payload
        },
        removeUser: (state,action) =>{
            return null;
        }
    }
})


export default userSlice.reducer

export const { addUser ,removeUser} = userSlice.actions