import { format } from "date-fns";
import { FaPaperPlane, FaShareAlt, FaTrashAlt } from "react-icons/fa";
import { MdFormatListNumbered } from "react-icons/md";
import { Link } from "react-router-dom";

const baseUrl =
  process.env.NODE_ENV === "production"
    ? "https://itimocktest.vercel.app"
    : "http://localhost:3000";

const MockTestCard = ({ test, user, handleDelete, isDeleting }) => {
  const handleShare = async (paperId) => {
    // Construct a decorated share message

    const examUrl = `${baseUrl}/attain-test?paperid=${paperId}`;
    const shareText = `
    🎉 *_MSQs Exam Paper_* 🎉
    
    _Hey there!_
    _Check out this Exam Paper_
     Paper ID: *${paperId}*
    
    📚 *Trade:* ${test.tradeName}
    💯 *Total Marks:* ${test.quesCount}
    ⏳ *Duration:* 1 Hour
    
    👉 Click the link below to get started:
    ${examUrl}
    
    *Remember to submit on complete!*
    
     Good luck and happy Exam!
    `;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Mock Test Paper",
          text: shareText,
        });

        console.log("Share successful");
      } else {
        console.log("Web Share API not supported");
        // Fallback copy to clipboard
        await navigator.clipboard.writeText(shareText);
        alert("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <p className="text-sm text-gray-500">
        {format(new Date(test.$createdAt), "yyyy/MM/dd hh:mm a")}
      </p>
      <h2 className="text-xl font-semibold text-gray-800 mt-2">
        {test.tradeName || "No Trade Name"}
      </h2>
      <p className="text-gray-600 mt-2">
        <strong>Paper ID:</strong> {test.paperId}
      </p>
      <p className="text-gray-600">
        <strong>Year:</strong> {test.year || "-"}
      </p>
      <p className="text-gray-600">
        <strong>Score:</strong> {test.score !== null ? test.score : "-"}
      </p>
      <p className="text-gray-600">
        <strong>Total Questions:</strong>{" "}
        {test.quesCount !== null ? test.quesCount : "50"}
      </p>
      <p className="text-gray-600">
        <strong>Submitted:</strong> {test.submitted ? "Yes" : "No"}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-4  ">
        {test.submitted ? (
          <div className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2">
            <FaPaperPlane />
            <Link to={`/show-mock-test/${test.$id}`} className="">
              Show Test
            </Link>
          </div>
        ) : (
          <div className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md flex  items-center justify-center w-full gap-2">
            <FaPaperPlane />
            <Link to={`/start-mock-test/${test.$id}`} className="">
              Start Test
            </Link>
          </div>
        )}

        <div className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-md flex gap-2 items-center justify-center w-full">
          <MdFormatListNumbered />
          <Link to={`/mock-test-result/${test.paperId}`} className="">
            Test Scores
          </Link>
        </div>
        <button
          onClick={() => handleShare(test.paperId)}
          className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md flex gap-2 items-center justify-center w-full"
        >
          <FaShareAlt />
          <span>Share</span>
        </button>
        {user.labels.includes("Teacher") && (
          <button
            disabled={isDeleting[test.$id]}
            onClick={() => handleDelete(test.$id)}
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md flex gap-2 items-center justify-center w-full"
          >
            <FaTrashAlt />

            <span>{isDeleting[test.$id] ? "Deleting..." : "Delete"}</span>
          </button>
        )}
      </div>
    </div>
  );
};
export default MockTestCard;
