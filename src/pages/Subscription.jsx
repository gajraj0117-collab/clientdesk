
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Check,
  Crown,
  Zap,
  Building2,
  LoaderCircle,
} from "lucide-react";
import "./Subscription.css";

const plans = [
  {
    code: "free",
    name: "Free",
    description: "For individuals and small businesses",
    monthly: 0,
    yearly: 0,
    clients: "10",
    staff: "1",
    storage: "500 MB",
    features: [
      "Client Portal",
      "Basic Reports",
      "Document Management",
      "Task Management",
    ],
  },
  {
    code: "pro",
    name: "Pro",
    description: "For growing professional businesses",
    monthly: 999,
    yearly: 9999,
    clients: "Unlimited",
    staff: "5",
    storage: "20 GB",
    features: [
      "Everything in Free",
      "Unlimited Clients",
      "Advanced Reports",
      "Priority Support",
      "20 GB Storage",
    ],
  },
  {
    code: "enterprise",
    name: "Enterprise",
    description: "For large professional businesses",
    monthly: 2999,
    yearly: 29999,
    clients: "Unlimited",
    staff: "Unlimited",
    storage: "100 GB",
    features: [
      "Everything in Pro",
      "Unlimited Staff",
      "Custom Branding",
      "Dedicated Support",
      "100 GB Storage",
    ],
  },
];

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
}

export default function Subscription() {
  const [billing, setBilling] = useState("monthly");
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadSubscription();
  }, []);

  async function loadSubscription() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("Please login again.");

      const { data: membership, error: membershipError } =
        await supabase
          .from("memberships")
          .select("business_id")
          .eq("user_id", user.id)
          .eq("role", "owner")
          .single();

      if (membershipError) throw membershipError;

      const { data, error } = await supabase
        .from("business_subscriptions")
        .select(`
          id,
          status,
          billing_cycle,
          current_period_end,
          subscription_plans (
            code,
            name
          )
        `)
        .eq("business_id", membership.business_id)
        .eq("is_current", true)
        .maybeSingle();

      if (error) throw error;

      setCurrentPlan(data);
      return true;
    } catch (error) {
      setMessage(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade(plan) {
    if (processing) return;

    if (currentPlan?.subscription_plans?.code === plan.code) {
      setMessage("This is already your current plan.");
      return;
    }

    if (plan.code === "free") {
      setMessage(
        "Downgrading to Free is not available yet. Please contact support."
      );
      return;
    }

    try {
      setMessage("");
      setProcessing(true);

      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error("Razorpay Checkout could not be loaded.");
      }

      // Create a payment order securely on the server.
      const { data: orderData, error: orderError } =
        await supabase.functions.invoke("create-razorpay-order", {
          body: {
            plan_code: plan.code,
            billing_cycle: billing,
          },
        });

      if (orderError) throw orderError;

      if (!orderData?.success || !orderData?.order_id) {
        throw new Error(
          orderData?.error || "Could not create payment order."
        );
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "ClientDesk",
        description: `${plan.name} Plan - ${billing}`,
        order_id: orderData.order_id,

        prefill: {
          name: user?.user_metadata?.full_name || "",
          email: user?.email || "",
        },

        theme: {
          color: "#4f46e5",
        },

        modal: {
          ondismiss: () => {
            setProcessing(false);
            setMessage("Payment window closed. No payment was confirmed.");
          },
        },

        handler: async function (paymentResponse) {
          try {
            setMessage("Verifying your payment...");

            const { data: verifyData, error: verifyError } =
              await supabase.functions.invoke(
                "verify-razorpay-payment",
                {
                  body: {
                    transaction_id: orderData.transaction_id,
                    razorpay_order_id:
                      paymentResponse.razorpay_order_id,
                    razorpay_payment_id:
                      paymentResponse.razorpay_payment_id,
                    razorpay_signature:
                      paymentResponse.razorpay_signature,
                  },
                }
              );

            if (verifyError) throw verifyError;

            if (!verifyData?.success) {
              throw new Error(
                verifyData?.error || "Payment verification failed."
              );
            }

            await loadSubscription();

            setMessage(
              `Payment successful! Your ${plan.name} plan has been activated.`
            );
          } catch (error) {
            setMessage(
              error.message ||
                "Payment received, but verification needs attention. Please contact support."
            );
          } finally {
            setProcessing(false);
          }
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", function (response) {
        setProcessing(false);

        setMessage(
          response.error?.description ||
            "Payment failed. Please try again."
        );
      });

      razorpay.open();
    } catch (error) {
      setMessage(error.message || "Unable to start payment.");
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="subscription-loading">
        <LoaderCircle className="spin" size={28} />
        <p>Loading subscription...</p>
      </div>
    );
  }

  return (
    <div className="subscription-page">
      <div className="subscription-heading">
        <div>
          <span className="subscription-eyebrow">
            BILLING & SUBSCRIPTION
          </span>
          <h1>Choose Your Plan</h1>
          <p>Manage your ClientDesk subscription.</p>
        </div>

        <div className="subscription-heading-icon">
          <Crown size={28} />
        </div>
      </div>

      {message && (
        <div className="subscription-message">
          {message}
          <button onClick={() => setMessage("")}>×</button>
        </div>
      )}

      <div className="current-plan-card">
        <div>
          <span className="current-plan-label">CURRENT PLAN</span>
          <h2>
            {currentPlan?.subscription_plans?.name || "No Plan"}
          </h2>
          <span className="subscription-status">
            {currentPlan?.status || "Not active"}
          </span>
        </div>

        <div className="current-plan-icon">
          <Zap size={27} />
        </div>
      </div>

      <div className="billing-selector">
        <button
          className={billing === "monthly" ? "active" : ""}
          onClick={() => setBilling("monthly")}
          disabled={processing}
        >
          Monthly
        </button>

        <button
          className={billing === "yearly" ? "active" : ""}
          onClick={() => setBilling("yearly")}
          disabled={processing}
        >
          Yearly
          <span>Save more</span>
        </button>
      </div>

      <div className="subscription-plans">
        {plans.map((plan) => {
          const isCurrent =
            currentPlan?.subscription_plans?.code === plan.code;

          const price =
            billing === "monthly" ? plan.monthly : plan.yearly;

          return (
            <div
              className={`subscription-plan-card ${
                plan.code === "pro" ? "popular-plan" : ""
              }`}
              key={plan.code}
            >
              {plan.code === "pro" && (
                <div className="popular-label">MOST POPULAR</div>
              )}

              <div className="plan-icon">
                {plan.code === "enterprise" ? (
                  <Building2 size={23} />
                ) : plan.code === "pro" ? (
                  <Crown size={23} />
                ) : (
                  <Zap size={23} />
                )}
              </div>

              <h2>{plan.name}</h2>
              <p className="plan-description">
                {plan.description}
              </p>

              <div className="plan-price">
                <strong>
                  ₹{price.toLocaleString("en-IN")}
                </strong>
                <span>
                  /{billing === "monthly" ? "month" : "year"}
                </span>
              </div>

              <div className="plan-limits">
                <div>
                  <span>Clients</span>
                  <strong>{plan.clients}</strong>
                </div>

                <div>
                  <span>Staff</span>
                  <strong>{plan.staff}</strong>
                </div>

                <div>
                  <span>Storage</span>
                  <strong>{plan.storage}</strong>
                </div>
              </div>

              <div className="plan-features">
                {plan.features.map((feature) => (
                  <div key={feature}>
                    <Check size={17} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                className={`plan-button ${
                  isCurrent ? "current-button" : ""
                }`}
                onClick={() => handleUpgrade(plan)}
                disabled={isCurrent || processing}
              >
                {processing ? (
                  <>
                    <LoaderCircle
                      size={16}
                      className="spin"
                    />
                    Processing...
                  </>
                ) : isCurrent ? (
                  "Current Plan"
                ) : plan.code === "free" ? (
                  "Free Plan"
                ) : (
                  "Choose Plan"
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
