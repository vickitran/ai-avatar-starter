import { useState, useEffect } from "react";
import Head from "next/head";
import Image from "next/image";

const Home = () => {
  // Don't retry more than 20 times
  const maxRetries = 20;
  const [input, setInput] = useState("");
  const [img, setImg] = useState("");
  //number of retries
  const [retry, setRetry] = useState(0);
  //number of retries left
  const [retryCount, setRetryCount] = useState(maxRetries);
  // Add isGenerating state
  const [isGenerating, setIsGenerating] = useState(false);
  // get prompt for img to display underneath
  const [finalPrompt, setFinalPrompt] = useState("");
  const onChange = (event) => {
    setInput(event.target.value);
  };
  //add generateAction
  const generateAction = async () => {
    console.log("Generating...");

    // Add this check to make sure there's no double click
    if (isGenerating && retry == 0) return;

    setIsGenerating(true);

    if (retry > 0) {
      setRetryCount((prevState) => {
        if (prevState === 0) {
          return 0;
        } else {
          return prevState - 1;
        }
      });
      setRetry(0);
    }

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "image/jpeg",
      },
      body: JSON.stringify({ input }),
    });
    const data = await response.json();

    if (response.status == 503) {
      console.log("Model is loading still :(");
      setRetry(data.estimated_time);
      return;
    }
    if (!response.ok) {
      console.log(`Error: ${data.error}`);
      // Stop Loading
      setIsGenerating(false);
      return;
    }
    // Set final prompt here
    setFinalPrompt(input);
    // Remove content from input box
    setInput("");
    setImg(data.image);
    setIsGenerating(false);
  };
  const sleep = (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };
  useEffect(() => {
    const runRetry = async () => {
      if (retryCount === 0) {
        console.log(
          `Model still loading after ${maxRetries} retrues. Try request again in 5 minutes.`
        );
        setRetryCount(maxRetries);
        return;
      }
      console.log(`Trying again in ${retry} seconds.`);

      await sleep(retry * 1000);
      await generateAction();
    };
    if (retry === 0) {
      return;
    }
    runRetry();
  }, [retry]);
  return (
    <div className="root">
      <Head>
        <title>AI Avatar Generator | made with buildspace</title>
      </Head>
      <div className="container">
        <div className="header">
          <div className="header-title">
            <h1>Victoria AI Picture Generator</h1>
          </div>
          <div className="header-subtitle">
            <h2>
              Use AI to imagine me into anything! Make sure to refer to me as
              "victran" in the prompt
            </h2>
          </div>
          <div className="prompt-container">
            <input className="prompt-box" value={input} onChange={onChange} />
            <div className="prompt-buttons">
              <a
                className={
                  isGenerating ? "generate-button loading" : "generate-button"
                }
                onClick={generateAction}
              >
                <div className="generate">
                  {isGenerating ? (
                    <span className="loader"></span>
                  ) : (
                    <p>Generate</p>
                  )}
                </div>
              </a>
            </div>
          </div>
        </div>
        {/* add ouput container if there's something in the img propoerty display this img */}
        {img && (
          <div className="output-content">
            <Image src={img} width={512} height={512} alt={input}></Image>
            {/* Add prompt here */}
            <p>{finalPrompt}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
