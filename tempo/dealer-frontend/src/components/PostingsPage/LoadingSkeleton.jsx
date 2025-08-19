import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const LoadingSkeleton = ({ postsPerPage = 15 }) => {
  return (
    <div className="row justify-content-center mt-5">
      {Array.from({ length: postsPerPage }).map((_, idx) => (
        <div
          key={idx}
          className="col-md-6 col-lg-4 mb-4"
          style={{ minHeight: 220 }}
        >
          <Skeleton height={180} style={{ borderRadius: 18 }} />
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
