// eslint-disable-next-line simple-import-sort/imports
import "./style.scss";
import {  useState } from "react";
// import { ThemeProvider } from "@material-ui/core/styles";
import { QueryClient, QueryClientProvider } from "react-query";
import {  Typography, useMediaQuery } from "@material-ui/core";
// import CssBaseline from "@material-ui/core/CssBaseline";
import useTheme from "./hooks/useTheme";
// import { dark as darkTheme } from "./themes/dark.js";
// import Footer from "./components/Footer/Footer";
// import { makeStyles } from "@material-ui/core/styles";
// import LogoImage from "src/assets/images/panadao-logo.png";

const queryClient = new QueryClient();

// const drawerWidth = 280;
// const transitionDuration = 969;

// const useStyles = makeStyles(theme => ({
//     drawer: {
//         [theme.breakpoints.up("md")]: {
//             width: drawerWidth,
//             flexShrink: 0,
//         },
//     },
//     content: {
//         flexGrow: 1,
//         padding: theme.spacing(1),
//         transition: theme.transitions.create("margin", {
//             easing: theme.transitions.easing.sharp,
//             duration: transitionDuration,
//         }),
//         height: "100%",
//         overflow: "auto",
//         textAlign: 'center',
//         marginTop: '5rem'
//     },
//     contentShift: {
//         transition: theme.transitions.create("margin", {
//             easing: theme.transitions.easing.easeOut,
//             duration: transitionDuration,
//         }),
//         marginLeft: 0,
//     },
//     // necessary for content to be below app bar
//     toolbar: theme.mixins.toolbar,
//     drawerPaper: {
//         width: drawerWidth,
//     },
// }));

function CountDownSmall({countDown,headerContent}:{countDown:number,headerContent:string}) {
    const [theme, toggleTheme] = useTheme();

    const isSmallerScreen = useMediaQuery("(max-width: 980px)");
    const isSmallScreen = useMediaQuery("(max-width: 600px)");
    const [mobileOpen, setMobileOpen] = useState(false);
    // const classes = useStyles();
    // let themeMode = darkTheme;
    const [daysToShow, setDaysToShow] = useState<number>();
    const [hoursToShow, setHoursToShow] = useState<number>();
    const [minToShow, setMinToShow] = useState<number>();
    const [secToShow, setSecToShow] = useState<number>();
    const options = {  year: 'numeric', month: 'long', day: 'numeric' };
    // useEffect(() => {
    //     themeMode = darkTheme;
    // }, [theme]);


    function timer() {
        const second = 1000,
            minute = second * 60,
            hour = minute * 60,
            day = hour * 24;

        //I'm adding this section so I don't have to keep updating this pen every year :-)
        //remove this if you don't need it
        let today = new Date();
        const dd = String(today.getDate()).padStart(2, "0"),
            mm = String(today.getMonth() + 1).padStart(2, "0"),
            yyyy = today.getFullYear(),
            dayMonth = "08/15/",
            launchDate = dayMonth + yyyy;

        today = new Date(mm + "/" + dd + "/" + yyyy);

        // const countDown = new Date("2022-08-15T09:00:00.000-05:00").getTime(); // new Date(launchDate).getTime();
        // const countDown = new Date(Date.UTC(2022,8,19,16,0,0,0)).getTime(); //3pm gmt == 11am est
        const x = setInterval(function () {

            const now = new Date().getTime(),
                distance = countDown - now;

            setDaysToShow(Math.floor(distance / (day))),
                setHoursToShow(Math.floor((distance % (day)) / (hour))),
                setMinToShow(Math.floor((distance % (hour)) / (minute))),
                setSecToShow(Math.floor((distance % (minute)) / second));

            //do something later when date is reached
            if (distance < 0) {
                clearInterval(x);
            }
            //seconds
        }, 0)
    }

    timer();

    return (
        <QueryClientProvider client={queryClient}>
             <div>                        
                        <div className="counter-container">
                            <h1 id="headline">{headerContent}</h1>
                            <br />                            
                            <Typography variant="subtitle1">{(new Date(countDown)).toLocaleDateString('en-us', options)}</Typography>
                            <div className="countdown-container">
                                <ul>
                                    <li className="countdownListItem"><span className="countdownListSpan" id="days">{daysToShow}</span>days</li>
                                    <li className="countdownListItem"><span className="countdownListSpan" id="hours">{hoursToShow}</span>Hours</li>
                                    <li className="countdownListItem"><span className="countdownListSpan" id="minutes">{minToShow}</span>Minutes</li>
                                    <li className="countdownListItem"><span className="countdownListSpan" id="seconds">{secToShow}</span>Seconds</li>
                                </ul>
                            </div>
                            <div id="content" className="">
                            </div>
                        </div>
                    </div>
        </QueryClientProvider>
    );
}

export default CountDownSmall;
