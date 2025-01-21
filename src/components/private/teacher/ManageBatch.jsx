import React from "react";
import { Outlet } from "react-router-dom";

const ManageBatch = () => {
  return (
    <div>
      <div className="mt-20">ManageBatch</div>
      <Outlet />
    </div>
  );
};

export default ManageBatch;
